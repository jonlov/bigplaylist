define(function(){var n=angular.module("coreModule");n.directive("ngEnter",function(){return function(n,e,t){e.bind("keydown keypress",function(e){13===e.which&&(n.$apply(function(){n.$eval(t.ngEnter)}),e.preventDefault())})}})});