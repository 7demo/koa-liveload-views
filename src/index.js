'use strict'

const fs = require('fs')
const { resolve } = require('path')
const debug = require('debug')('koa-views')
const consolidate = require('consolidate')
const send = require('koa-send')
const getPaths = require('get-paths')
const pretty = require('pretty')
const WebSocket = require('ws')
const port = 12381
let server

module.exports = viewsMiddleware

function viewsMiddleware(
  path,
  { engineSource = consolidate, extension = 'html', options = {}, map, watch } = {}
) {
  return function views(ctx, next) {
    if (ctx.render) return next()

    // create server
    if (!server && watch && watch.liveLoadFlag) {
    	server = new WebSocket.Server({
			  port: port,
			  perMessageDeflate: false
			})
    }

    ctx.response.render = ctx.render = function(relPath, locals = {}) {
      return getPaths(path, relPath, extension).then(paths => {
        const suffix = paths.ext
        const state = Object.assign(locals, options, ctx.state || {})
        // deep copy partials
        state.partials = Object.assign({}, options.partials || {})
        debug('render `%s` with %j', paths.rel, state)
        ctx.type = 'text/html'

        // 创建监听
        if (watch && watch.liveLoadFlag) {
        	server.on('connection', (ws) => {
        		ctx.ws = ws
        		const watchDir = watch.path || []
	        	for (let i = 0; i < watchDir.length; i++) {
	        		fs.watch(watchDir[i], {
					     	recursive: true
					    }, (eventType, filename) => {
					      ws.send('reload')
					    })
	        	}
        	})
        }

        if (isHtml(suffix) && !map) {
        	if (watch && watch.liveLoadFlag) {
        		const _html = fs.readFileSync(resolve(path, paths.rel), 'utf-8')
        		ctx.body = insertWsToHtml(ctx, _html)
        	} else {
        		return send(ctx, paths.rel, {
	            root: path
	          })
        	}
        } else {
          const engineName = map && map[suffix] ? map[suffix] : suffix
          const render = engineSource[engineName]
          if (!engineName || !render)
            return Promise.reject(
              new Error(`Engine not found for the ".${suffix}" file extension`)
            )
          return render(resolve(path, paths.rel), state).then(html => {
          	if (watch.liveLoadFlag) {
          		html = insertWsToHtml(html, ctx)
          	}
            // since pug has deprecated `pretty` option
            // we'll use the `pretty` package in the meanwhile
            if (locals.pretty) {
              debug('using `pretty` package to beautify HTML')
              html = pretty(html)
            }
            if (watch && watch.liveLoadFlag) {
            	html = insertWsToHtml(ctx, _html)
            }
            ctx.body = html
          })
        }
      })
    }

    return next()
  }
}

function isHtml(ext) {
  return ext === 'html'
}

function getHost(host) {
	const index = host.indexOf(':')
	if (index > -1) {
		host = host.substr(0, index)
	}
	return host
}

function createWsScript(ctx, html) {
	const host = getHost(ctx.request.host)
	const script = `<script>
		var ws = new WebSocket('ws://${host}:${port}')
		ws.onopen = function() {
			console.log('watting')
		}
		ws.onmessage = function(msg) {
			if (msg.data === 'reload') {
				ws.close()
				location.reload()
			}
		}
		ws.onerror = function(err) {
			console.log('err:', err)
		}
		ws.onclose = function (msg) {
			console.log('close: ', msg)
		}
	</script>
	`
	return script
}

function insertWsToHtml(ctx, html) {
	html = html.replace('</body>', createWsScript(ctx, html) + '</body>')
	return html
}
