# Trace Service Map

A Kibana plugin to show a graphical service map created from execution traces in [Zipkin](https://zipkin.io/) format.
The traces have to contain certain tags and attributes to get displayed correctly in the map (see [Trace Format](#trace-format)).

---

## Installation

Prerequisites: Elasticsearch and Kibana 7.10.0

<code>
./bin/kibana-plugin install https://github.com/noah-kogler/trace_network_map/blob/master/build/traceNetworkMap-7.10.0.zip
</code>

## Development

1. See the [kibana contributing guide](https://github.com/elastic/kibana/blob/master/CONTRIBUTING.md) for instructions setting up your development environment!
2. Download the code of this plugin and put it into the kibana/plugins-directory. 
3. Start your kibana development environment with <code>nvm use; yarn start --oss</code>
4. Navigate your browser to <KIBANA-URL>/app/traceNetworkMap

__Note:__ You can a URL parameter <KIBANA-URL>/app/traceNetworkMap?enableTimeFilter=false to disable Kibana's time filtering mechanism.
This may be helpful for development.

## Scripts

<dl>
  <dt><code>yarn kbn bootstrap</code></dt>
  <dd>Execute this to install node_modules and setup the dependencies in your plugin and in Kibana</dd>

  <dt><code>yarn plugin-helpers build</code></dt>
  <dd>Execute this to create a distributable version of this plugin that can be installed in Kibana</dd>
</dl>

---

## Trace Format

The service map supports different types of traces. Each trace-type has a corresponding node-data-class in public/node/data.
These classes defined which information from the traces is displayed in the service map nodes and also contains some
nodes to aggregate and group traces for a better overview. To extend the traces a specific node-data-class needs to be 
created and registered in public/node/data.ts.

Traces are recognized by their <code>localEndpoint</code> or their <code>remoteEndpoint</code>. Additional tags must
be set to provide the service map with the required information.
The following traces are supported:

### Web frontend

__localEndpoint__

<code>web-frontend</code>

__tags__
* <code>page</code> Should contain the URL path of the page the fetch call was triggered from.
* <code>http.status_code</code> The HTTP status code of the request.

Traces coming from the web frontend must be in the format provided by the [zipkin-js fetch instrumentation](https://github.com/openzipkin/zipkin-js/tree/master/packages/zipkin-instrumentation-fetch).

### Api

__localEndpoint__

<code>api</code>

__tags__
* <code>http.path</code> Needed to identify the API-URL.

### Redis

__remoteEndpoint__

<code>redis</code>

__tags__
* <code>hash</code> An additional hash code describing the cache item.
* <code>result.exists</code> For "has" operations. Should be "1" if a cache object exists and "0" otherwise.
* <code>result.success</code> For "get", "set",... operations. Should be "1" if a cache object exists and "0" otherwise.

The name of the trace should be the name of the operation on the redis cache.

### MySql

__remoteEndpoint__

<code>mysql</code>

__tags__
* <code>table</code> The tables a database statement operates on. Could be a list in case of joins.
* <code>result.count</code> The number of returned/modified rows in the statement.

The name of the trace should be the database operation: E.g. "select", "update" or "insert".

### S3

__remoteEndpoint__

<code>s3</code>

__tags__
* <code>name</code> The name of the s3 operation. E.g. CopyObject, ListObjects.
* <code>key</code> The key of the object manipulated/queried in s3.
* <code>result.exists</code> Needed if the operation checks the existence of an object. Should be "1" or "0".
* <code>result.count</code> The number of objects manipulated/queried.

The name of the trace should be method name of the method called on S3 (e.g. executeAsync).