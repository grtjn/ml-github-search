xquery version "1.0-ml";

module namespace ext = "http://marklogic.com/rest-api/resource/count-views";

declare default function namespace "http://www.w3.org/2005/xpath-functions";

declare namespace rapi = "http://marklogic.com/rest-api";
declare namespace roxy = "http://marklogic.com/roxy";

declare option xdmp:mapping "false";

declare
%roxy:params("uri=xs:string")
function ext:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  let $_ := map:put($context, "output-types", "application/json")
  let $uri := map:get($params, "uri")
  let $count as xs:int := (xdmp:document-get-properties($uri, xs:QName("view-count")), 0)[1]
  return document {
    object-node {
      "view-count": number-node{ $count }
    }
  }
};

declare
%rapi:transaction-mode("update")
%roxy:params("uri=xs:string")
function ext:post(
  $context as map:map,
  $params  as map:map,
  $input   as document-node()*
) as document-node()*
{
  let $_ := map:put($context, "output-types", "application/json")
  let $uri := map:get($params, "uri")
  let $count as xs:int := (xdmp:document-get-properties($uri, xs:QName("view-count")), 0)[1]
  let $new-count := $count + 1
  let $_ := xdmp:document-set-property($uri, <view-count>{$new-count}</view-count>)
  return document {
    object-node {
      "view-count": number-node{ $new-count }
    }
  }
};
