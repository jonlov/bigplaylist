define(function(){var n=angular.module("coreModule");n.controller("mainController",["$scope","$auth","loadUserInfo","BPConfig",function(n,e,o,t){n.isAuthenticated=e.isAuthenticated,n.userInfo=function(){o(t.apiUrl).then(function(e){n.profile=e.user})}}])});