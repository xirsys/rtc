'use strict';

// `goog`, `goog.provide`, `goog.require stubbing`.
if (typeof goog === 'undefined') { goog = {}; }
if (!goog.provide) { goog.provide = function () { }; }
if (!goog.require) { goog.require = function () { }; }

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('closureStub');