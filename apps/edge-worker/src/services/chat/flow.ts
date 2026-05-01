// Chat flow is the backend orchestration boundary for chat routes.
// Put protocol sequencing here: SSE events, confirmation execution, reclassify
// execution, provider resolution, LLM calls, and assistant-message persistence.
import { getUserSettings } from '../behavior'
import {
  resolveEnvSummaryProviderConfig,
  resolveUserAiProviderConfig,
  type ResolvedAiProviderConfig,
} from '../ai-provider'
import { resolveStoredAiApiKey } from '../ai-key-crypto'
import {
  buildPendingConfirmationResponse,
  executeConfirmedChatAction,
  reclassifyChatAction,
} from './actions'
import { buildChatReplyContext } from './context'
import { classifyIntent } from './llm-classify'
import { generateChatReply } from './llm-reply'
import {
  buildCandidateIntents,
  parseIntent,
  requiresConfirmation,
} from './intent'
import {
  appendChatMessage,
  getOrCreateActiveSession,
} from './store'
import type { ChatActionResponse } from './types'
import type {
  ChatConfirmRequest,
  ChatMessageStreamRequest,
  ChatQuickAction,
  ChatReclassifyRequest,
  ChatStreamEventName,
  ChatStreamEventPayloadMap,
} from '../../types/page-data'

export type ChatRuntimeEnv = {
  SUMMARY_PROVIDER_ENABLED?: string
  SUMMARY_PROVIDER_API_URL?: string
  SUMMARY_PROVIDER_API_KEY?: string
  SUMMARY_PROVIDER_MODEL?: string
  SUMMARY_PROVIDER_TRANSPORT?: string
  AI_KEY_ENCRYPTION_SECRET?: string
}

function intentLabel(intent: string): string {
  switch (intent) {
    case 'create_todo': return '记成待办'
    case 'record_thought': return '记成记录'
    case 'fragmented_thought': return '记成碎片'
    case 'chat_only': return '仅聊天'
    case 'add_interest': return '更新关注'
    case 'remove_interest': return '移除关注'
    case 'set_push_time': return '调整推送时间'
    default: return intent
  }
}

function buildIntentAnalysisText(params: {
  intentType: string
  confidence: number
}): string {
  if (params.confidence < 0.9) {
    return `我理解成「${intentLabel(params.intentType)}」，你确认一下？`
  }
  return `收到，我按「${intentLabel(params.intentType)}」来处理。`
}

function buildAssistantReplyText(summary: ChatActionResponse): string {
  const lines: string[] = []
  if (summary.success) {
    if (summary.confirmedType === 'chat_only') {
      lines.push('好的，这次不保存内容。')
    } else {
      const label = summary.confirmedType ? intentLabel(summary.confirmedType) : '处理'
      lines.push(`已${label}。`)
    }
  } else {
    lines.push(summary.successMessage)
  }
  if (summary.resultSummary) {
    lines.push(summary.resultSummary)
  }
  return lines.join('\n')
}

function buildSuggestedActions(response: ChatActionResponse): ChatQuickAction[] {
  const actions: ChatQuickAction[] = []
  const type = response.confirmedType ?? response.actionType

  if (response.deepLink && response.nextPageLabel) {
    actions.push({ label: response.nextPageLabel, action: response.nextPageLabel })
  }
  if (type === 'create_todo') {
    actions.push({ label: '记一条想法', action: '记一条想法', targetIntent: 'record_thought' })
    actions.push({ label: '记成碎片', action: '记成碎片', targetIntent: 'fragmented_thought' })
  } else if (type === 'record_thought' || type === 'fragmented_thought') {
    actions.push({ label: '改成待办', action: '改成待办', targetIntent: 'create_todo' })
  }
  if (type !== 'chat_only') {
    actions.push({ label: '仅聊天，不保存', action: '仅聊天', targetIntent: 'chat_only' })
  }
  return actions
}

function sendSSE<EventName extends ChatStreamEventName>(
  controller: ReadableStreamDefaultController,
  event: EventName,
  data: ChatStreamEventPayloadMap[EventName]
) {
  controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
}

async function resolveChatProviderConfig(params: {
  db: D1Database
  userId: number
  env: ChatRuntimeEnv
}): Promise<ResolvedAiProviderConfig | null> {
  const userSettings = await getUserSettings(params.db, params.userId)
  const userApiKey = await resolveStoredAiApiKey(userSettings, params.env.AI_KEY_ENCRYPTION_SECRET)
  return resolveUserAiProviderConfig({
    provider: userSettings?.ai_provider,
    apiKey: userApiKey,
  }) || resolveEnvSummaryProviderConfig(params.env)
}

export function createChatMessageStream(params: {
  db: D1Database
  userId: number
  env: ChatRuntimeEnv
  body: ChatMessageStreamRequest
}): ReadableStream {
  const { db, userId, env, body } = params
  const currentInterests = body.current_interests || []
  const result = parseIntent(body.input, currentInterests)

  return new ReadableStream({
    async start(controller) {
      try {
        const session = await getOrCreateActiveSession(db, userId, body.source_context || null)

        const needsLLM = !body.confirmed_type
          && !body.preferred_intent
          && (result.matchedBy === 'fallback'
            || result.matchedBy === 'fuzzy'
            || (result.matchedBy === 'keyword' && result.confidence < 0.88)
            || (result.matchedBy === 'pattern' && result.confidence < 0.88))

        let providerConfig: ResolvedAiProviderConfig | null = null
        let providerConfigResolved = false
        if (needsLLM) {
          try {
            providerConfig = await resolveChatProviderConfig({ db, userId, env })
            providerConfigResolved = true
          } catch (error) {
            console.warn('Read user AI provider settings failed, falling back to rule engine:', error)
          }
        }

        const llmResult = needsLLM && providerConfig
          ? await classifyIntent({
              input: body.input,
              ruleResult: result,
              config: providerConfig,
              invocation: {
                db,
                userId,
                feature: 'chat.intent_classify',
                requestRef: `chat_session:${session.id}`,
                metadata: {
                  ruleMatchedBy: result.matchedBy,
                  ruleConfidence: result.confidence,
                  hasSourceContext: Boolean(body.source_context),
                  currentInterestsCount: currentInterests.length,
                },
              },
              context: {
                interests: currentInterests,
                sourceContext: body.source_context || null,
              },
            })
          : null

        const selectedIntentType = llmResult?.type || result.type
        const intentType = body.confirmed_type || body.preferred_intent || selectedIntentType
        const candidateIntents = llmResult?.candidateIntents
          ?? buildCandidateIntents(body.input, currentInterests, selectedIntentType)
        const selectedConfidence = llmResult?.confidence ?? result.confidence
        const selectedEntities = llmResult?.entities ?? result.entities
        const selectedMatchedBy = llmResult?.matchedBy || result.matchedBy
        const shouldConfirm = !body.confirmed_type && !body.preferred_intent
          && requiresConfirmation(intentType, candidateIntents, selectedConfidence)

        let userMsgId: number | undefined
        if (body.append_user_message !== false) {
          userMsgId = await appendChatMessage(db, session.id, 'user', body.input, 'recognized', {
            sourceContext: body.source_context,
          })
        }

        const analysisText = llmResult?.replyHint || buildIntentAnalysisText({
          intentType,
          confidence: selectedConfidence,
        })
        sendSSE(controller, 'intent_analysis', {
          sessionId: session.id,
          userMessageId: userMsgId,
          text: analysisText,
          intentType,
          confidence: selectedConfidence,
          candidateIntents,
          sourceContext: body.source_context,
          matchedBy: selectedMatchedBy || undefined,
          llmClassified: llmResult !== null,
          replyHint: llmResult?.replyHint,
          suggestedActions: llmResult?.suggestedActions || [],
        })

        if (shouldConfirm) {
          const response = buildPendingConfirmationResponse({
            actionType: intentType,
            candidateIntents,
            confirmedType: body.confirmed_type || undefined,
            sourceContext: body.source_context,
          })

          const pendingMsgId = await appendChatMessage(
            db, session.id, 'assistant',
            `${response.successMessage}\n\n${response.resultSummary}`,
            'pending_confirmation',
            {
              intentType,
              candidateIntents,
              confidence: selectedConfidence,
              sourceContext: body.source_context || undefined,
              matchedBy: selectedMatchedBy || undefined,
              confirmedType: body.confirmed_type || undefined,
              actionType: intentType,
              resultSummary: response.resultSummary,
            }
          )

          sendSSE(controller, 'pending_confirmation', {
            sessionId: session.id,
            messageId: pendingMsgId,
            userMessageId: userMsgId,
            candidateIntents,
            userMessage: body.input,
          })
          sendSSE(controller, 'done', {})
          controller.close()
          return
        }

        const response = await executeConfirmedChatAction({
          db, userId,
          input: body.input,
          intentType,
          entities: selectedEntities,
          candidateIntents,
          sourceContext: body.source_context,
          sourceContentRef: body.source_content_ref,
          sourceTitle: body.source_title,
          confirmedType: body.confirmed_type || intentType,
        })

        const fallbackReplyText = buildAssistantReplyText(response)
        const fallbackSuggestedActions = buildSuggestedActions(response)

        if (!providerConfigResolved) {
          try {
            providerConfig = await resolveChatProviderConfig({ db, userId, env })
            providerConfigResolved = true
          } catch (error) {
            console.warn('Read user AI provider settings failed, falling back to template reply:', error)
          }
        }

        let personalContext = null
        if (providerConfig) {
          try {
            personalContext = await buildChatReplyContext(db, userId)
          } catch (error) {
            console.warn('Build chat reply context failed, continuing without personal context:', error)
          }
        }

        const llmReply = providerConfig
          ? await generateChatReply({
              input: body.input,
              response,
              fallbackText: fallbackReplyText,
              fallbackSuggestedActions,
              config: providerConfig,
              invocation: {
                db,
                userId,
                feature: 'chat.reply',
                requestRef: `chat_session:${session.id}`,
                metadata: {
                  actionType: response.actionType,
                  confirmedType: response.confirmedType,
                  success: response.success,
                  matchedBy: selectedMatchedBy || null,
                  hasPersonalContext: Boolean(personalContext),
                },
              },
              personalContext,
              context: {
                confidence: selectedConfidence,
                matchedBy: selectedMatchedBy || undefined,
                sourceContext: body.source_context || null,
              },
            })
          : null

        const replyText = llmReply?.text || fallbackReplyText
        const suggestedActions = llmReply?.suggestedActions?.length
          ? llmReply.suggestedActions
          : fallbackSuggestedActions

        const assistantMsgId = await appendChatMessage(db, session.id, 'assistant', replyText, 'executed', {
          intentType: response.actionType,
          candidateIntents: response.candidateIntents,
          confidence: selectedConfidence,
          sourceContext: response.sourceContext || undefined,
          matchedBy: selectedMatchedBy || undefined,
          confirmedType: response.confirmedType,
          actionType: response.actionType,
          resultSummary: response.resultSummary,
          deepLink: response.deepLink,
          nextPageLabel: response.nextPageLabel,
          affectedEntityType: response.affectedEntity?.type,
          affectedEntityId: response.affectedEntity?.id !== undefined ? String(response.affectedEntity.id) : undefined,
        })

        sendSSE(controller, 'execution_result', {
          sessionId: session.id,
          messageId: assistantMsgId,
          userMessageId: userMsgId,
          text: replyText,
          success: response.success,
          actionType: response.actionType,
          confirmedType: response.confirmedType,
          resultSummary: response.resultSummary,
          deepLink: response.deepLink,
          nextPageLabel: response.nextPageLabel,
          affectedEntity: response.affectedEntity || undefined,
          suggestedActions,
          changeLog: response.changeLog || [],
          quickActions: suggestedActions,
          llmReplyGenerated: llmReply !== null,
        })

        sendSSE(controller, 'done', {})
        controller.close()
      } catch (error) {
        console.error('Chat message error:', error)
        sendSSE(controller, 'error', {
          message: error instanceof Error ? error.message : '处理失败',
        })
        sendSSE(controller, 'done', {})
        controller.close()
      }
    },
  })
}

export async function confirmChatMessage(params: {
  db: D1Database
  userId: number
  body: ChatConfirmRequest
}): Promise<ChatActionResponse & {
  messageId: number
  text: string
  sessionId: number
  suggestedActions: Array<{ label: string; action: string; targetIntent?: string }>
}> {
  const { db, userId, body } = params
  const session = await getOrCreateActiveSession(db, userId, body.source_context || null)
  const result = parseIntent(body.user_message, [])
  const intentType = body.confirmed_type

  const response = await executeConfirmedChatAction({
    db, userId,
    input: body.user_message,
    intentType,
    entities: result.entities,
    candidateIntents: [intentType],
    sourceContext: body.source_context,
    sourceContentRef: body.source_content_ref,
    sourceTitle: body.source_title,
    confirmedType: intentType,
  })

  const replyText = buildAssistantReplyText(response)
  const suggestedActions = buildSuggestedActions(response)
  const assistantMsgId = await appendChatMessage(db, session.id, 'assistant', replyText, 'executed', {
    intentType: response.actionType,
    candidateIntents: response.candidateIntents,
    confidence: 1.0,
    sourceContext: response.sourceContext || undefined,
    matchedBy: 'confirm',
    confirmedType: response.confirmedType,
    actionType: response.actionType,
    resultSummary: response.resultSummary,
    deepLink: response.deepLink,
    nextPageLabel: response.nextPageLabel,
    affectedEntityType: response.affectedEntity?.type,
    affectedEntityId: response.affectedEntity?.id !== undefined ? String(response.affectedEntity.id) : undefined,
  })

  return {
    ...response,
    messageId: assistantMsgId,
    text: replyText,
    sessionId: session.id,
    suggestedActions,
  }
}

export async function reclassifyChatMessage(params: {
  db: D1Database
  userId: number
  body: ChatReclassifyRequest
}): Promise<ChatActionResponse> {
  const { db, userId, body } = params
  const session = await getOrCreateActiveSession(db, userId, body.source_context || null)
  const result = parseIntent(body.original_input || '', [])
  const intentType = body.target_intent

  const response = await reclassifyChatAction({
    db,
    userId,
    targetIntent: intentType,
    correctionFrom: body.correction_from,
    originalInput: body.original_input,
    sourceContext: body.source_context,
    entities: result.entities,
  })

  await appendChatMessage(db, session.id, 'assistant', `${response.successMessage}\n\n${response.resultSummary || ''}`, 'executed', {
    intentType: response.actionType,
    candidateIntents: response.candidateIntents,
    confidence: 0.9,
    sourceContext: response.sourceContext || undefined,
    matchedBy: 'reclassify',
    confirmedType: response.confirmedType,
    actionType: response.actionType,
    resultSummary: response.resultSummary,
    deepLink: response.deepLink,
    nextPageLabel: response.nextPageLabel,
    affectedEntityType: response.affectedEntity?.type,
    affectedEntityId: response.affectedEntity?.id !== undefined ? String(response.affectedEntity.id) : undefined,
  })

  return response
}
