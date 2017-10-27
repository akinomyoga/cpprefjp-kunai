import {KunaiError} from './error'


class LoggerStyle {
  constructor(kv) {
    this.kv = kv
  }

  join() {
    return Object.keys(this.kv).map(k => {
      return `${k}:${this.kv[k]}`
    }).join(';')
  }

  toString() {
    return this.join()
  }

  clone(assigner) {
    return new LoggerStyle(Object.assign({}, this.kv, assigner))
  }
}

class LoggerOption {
  constructor(hashy) {
    this.data = Object.assign({}, hashy)
  }
}

class Logger {
  static Option = LoggerOption
  static Style = LoggerStyle

  static Level = {
    debug: {
      intensity: -1, label: 'DEBUG',
      out: console.debug,
      style: new Logger.Style({
        'font-family': 'sans-serif',
        'font-weight': 'bold',
        'text-decoration': 'underline',
        'color': '#B40486',
      }),
      icon: '⚒️',
    },

    info: {
      intensity: 0, label: 'INFO ',
      out: console.info,
      style: new Logger.Style({
        'font-family': 'sans-serif',
        'color': 'gray',
      }),
      icon: '📝',
    },
    warn: {
      intensity: 1, label: 'WARN ',
      out: console.warn,
      style: new Logger.Style({
        'font-family': 'sans-serif',
        'font-weight': 'bold',
        'color': '#ff8c00',
      }),
      icon: '⚠️',
    },
    error: {
      intensity: 2, label: 'ERROR',
      out: console.error,
      style: new Logger.Style({
        'font-family': 'sans-serif',
        'font-weight': 'bold',
        'color': '#dc143c',
      }),
      icon: '🚫',
    },
  } // Level

  static PartStyle = {
    message: new Logger.Style({'font-weight': 'bold', 'text-decoration': 'underline', 'color': '#aaa'}),
    message_body: new Logger.Style({'font-family': 'monospace', 'font-weight': 'normal', 'text-decoration': 'none', 'color': '#222'}),
    backtrace: new Logger.Style({'font-weight': 'bold', 'text-decoration': 'underline', 'color': '#aaa'}),
    icon: new Logger.Style({
      'font-family': 'sans-serif',
    })
  }

  static default_level() {
    return this.Level.debug
  }

  static defaultOptions = new Logger.Option({
    ctx: {
      level: Logger.default_level(),
      style: new Logger.Style({
        'font-weight': 'bold',
        'color': '#222222',
      }),
    },
  })

  constructor(ctx, opts) {
    this.orig_ctx = [].concat(ctx)
    this.ctx = [].concat(ctx)

    this.opts = new Logger.Option(Logger.defaultOptions.data)
    if (opts) {
      if (!(opts instanceof Logger.Option)) {
        throw new KunaiError(`unrecognized option type; did you mean: ['option1', 'option2', ...]`)
      }
      this.opts.data = Object.assign(this.opts.data, opts.data)
    }
  }

  original_context() {
    return this.orig_ctx
  }

  make_context(name, opts) {
    let l = new Logger(this.orig_ctx.concat(name), Object.assign(new Logger.Option(this.opts.data), opts))
    l.orig_ctx = Object.assign([], this.orig_ctx)
    return l
  }

  debug() {
    return this.log_impl(Logger.Level.debug, ...arguments)
  }
  info() {
    return this.log_impl(Logger.Level.info, ...arguments)
  }
  warn() {
    return this.log_impl(Logger.Level.warn, ...arguments)
  }
  error() {
    return this.log_impl(Logger.Level.error, ...arguments)
  }

  log_impl(level, arg1, ...args) {
    if (this.need_log(level)) {
      const master_output = level.intensity >= Logger.Level.error.intensity ? console.group : console.groupCollapsed

      const icon_fmt = this.opts.data.icon ? `%c${this.opts.data.icon.text}  ` : '%c'
      const icon_style = this.opts.data.icon ? Logger.PartStyle.icon.clone({color: this.opts.data.icon.color}).join() : ''


      master_output(
        `%c${level.icon} %c${level.label}%c ` +
        `[%c${this.ctx.join('::')}%c] ` +
        `${icon_fmt}%c` +
        `${arg1}`,

        level.style.clone(
          {'text-decoration': 'none'}
        ).join(),
        level.style.join(),
        '',
        this.opts.data.ctx.style.join(),
        '',
        icon_style,
        Logger.PartStyle.message_body.join()
      )

      // console.group(`%ccount`, Logger.PartStyle.message.join())
      // console.count()
      // console.groupEnd()

      if (args.length) {
        console.group(`%cmessage`, Logger.PartStyle.message.join())
        console.log(...args)
        console.groupEnd()
      }

      console.groupCollapsed('%cbacktrace', Logger.PartStyle.backtrace.join())
      console.trace()
      console.groupEnd()

      console.groupEnd()

    } else {
      // suppressed...
    }
  }

  need_log(level) {
    if (level.intensity === Logger.Level.debug.intensity) {
      if (process.env.NODE_ENV !== 'development') return false
    }

    return level.intensity >= this.opts.data.ctx.level.intensity
  }
}

export {Logger}

