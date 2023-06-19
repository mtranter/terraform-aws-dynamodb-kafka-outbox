import log from "lambda-log";

// extract XRay trace ID from Lambda context and injcet into log.
log.options.dynamicMeta = () => ({
  traceId: process.env._X_AMZN_TRACE_ID,
});

export default log;
