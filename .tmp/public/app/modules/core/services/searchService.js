define(function(){angular.module("coreModule").service("youtubeSearch",["$http","toastr",function(e,r){return function(n,t,a){var u=t.replace(/[#\/]/g,"").replace(/\\/g,"");if(!a)var a="null";var c=e.get(APIurl+"/youtube/search/"+u+"/"+a).then(function(e){return e.data})["catch"](function(e,n){r.error("Unexpected error "+response.data)})["finally"](function(){$("#loading").hide()});return c}}]).service("soundcloudSearch",["$http","toastr",function(e,r){return function(n,t,a){var u=t.replace(/[#\/]/g,"").replace(/\\/g,"");if(!c)var c="null";var o=e.get(APIurl+"/soundcloud/search/"+u+"/"+c).then(function(e){return e.data})["catch"](function(e,n){r.error("Unexpected error "+response.data)})["finally"](function(){$("#loading").hide()});return o}}])});