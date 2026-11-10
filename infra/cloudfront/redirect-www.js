// CloudFront Function (runtime cloudfront-js-2.0), viewer request event.
// 301-redirects www.noesis.vision/... to https://noesis.vision/... keeping path and query.
// Setup steps: infra/README.md
// eslint-disable-next-line no-unused-vars -- CloudFront calls handler() by name
function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : "";

  if (host.indexOf("www.") !== 0) return request;

  var query = [];
  var params = request.querystring;
  for (var key in params) {
    var param = params[key];
    var values = param.multiValue ? param.multiValue : [param];
    for (var i = 0; i < values.length; i++) {
      query.push(values[i].value === "" ? key : key + "=" + values[i].value);
    }
  }

  return {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: {
      location: {
        value:
          "https://" +
          host.slice(4) +
          request.uri +
          (query.length ? "?" + query.join("&") : ""),
      },
      "cache-control": { value: "max-age=86400" },
    },
  };
}
