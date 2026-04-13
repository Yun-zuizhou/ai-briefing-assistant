"""API package entrypoint.

Keep this package init side-effect free so service-layer modules can import
`app.api.v1.page_schemas` without recursively importing the whole router tree.
"""
