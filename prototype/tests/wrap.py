import io,sys
# Reproduce the publisher's wrapper exactly, so local mobile testing matches the artifact.
HEAD = ('<!doctype html><html><head><meta charset=utf8>'
        '<meta name=viewport content="width=device-width,initial-scale=1">'
        '<style>:root{color-scheme:light}body{margin:0;padding:0;'
        'font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}'
        'img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>'
        '</head><body>\n')
src, dst = sys.argv[1], sys.argv[2]
io.open(dst,'w',encoding='utf-8').write(HEAD + io.open(src,encoding='utf-8').read() + '\n</body></html>')
print('wrapped ->', dst)
