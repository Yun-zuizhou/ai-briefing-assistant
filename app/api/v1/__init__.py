"""Versioned API package.

Submodules are imported explicitly by callers when needed. Avoid eager package
aggregation here so standalone imports of content-processing modules do not
pull `content.py` back in during package initialization.
"""
