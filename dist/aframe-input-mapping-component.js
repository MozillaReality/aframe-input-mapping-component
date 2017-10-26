/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

	/* global AFRAME */

	if (typeof AFRAME === 'undefined') {
	  throw new Error('Component attempted to register before AFRAME was available.');
	}

	AFRAME.currentInputMapping = 'default';
	AFRAME.inputMappings = {};

	AFRAME.registerSystem('input-mapping', {
	  mappings: {},
	  mappingsPerControllers: {},
	  loadedControllers: [],

	  init: function () {
	    var self = this;

	    this.keyboardHandler = this.keyboardHandler.bind(this);

	    this.sceneEl.addEventListener('inputmappingregistered', function () {
	      self.removeControllersListeners();
	      for (var i = 0; i < self.loadedControllers.length; i++) {
	        var controllerObj = self.loadedControllers[i];
	        self.updateControllersListeners(controllerObj);
	      }
	    });

	    // Controllers
	    this.sceneEl.addEventListener('controllerconnected', function (event) {
	      var controllerObj = {
	        name: event.detail.name,
	        hand: event.detail.component.data.hand,
	        element: event.detail.target,
	        handlers: {}
	      };
	      self.loadedControllers.push(controllerObj);

	      self.updateControllersListeners(controllerObj);
	    });

	    // Keyboard
	    this.addKeyboardListeners();
	  },

	  addKeyboardListeners: function () {
	    document.addEventListener('keyup', this.keyboardHandler);
	    document.addEventListener('keydown', this.keyboardHandler);
	    document.addEventListener('keypress', this.keyboardHandler);
	  },

	  removeKeyboardListeners: function () {
	    document.removeEventListener('keyup', this.keyboardHandler);
	    document.removeEventListener('keydown', this.keyboardHandler);
	    document.removeEventListener('keypress', this.keyboardHandler);
	  },

	  removeControllerListeners: function (controller) {
	    for (var eventName in controller.handlers) {
	      var handler = controller.handlers[eventName];
	      controller.element.removeEventListener(eventName, handler);
	    }
	    controller.handlers = {};
	  },

	  updateControllersListeners: function (controllerObj) {
	    this.removeControllerListeners(controllerObj);

	    if (!AFRAME.inputMappings.mappings) {
	      console.warn('controller-mapping: No mappings defined');
	      return;
	    }

	    var mappingsPerController = this.mappingsPerControllers[controllerObj.name] = {};

	    // Create the listener for each event
	    for (var mappingName in AFRAME.inputMappings.mappings) {
	      var mapping = AFRAME.inputMappings.mappings[mappingName];

	      var commonMappings = mapping.common;
	      if (commonMappings) {
	        this.updateMappingsPerController(commonMappings, mappingsPerController, mappingName);
	      }

	      var controllerMappings = mapping[controllerObj.name];
	      if (controllerMappings) {
	        this.updateMappingsPerController(controllerMappings, mappingsPerController, mappingName);
	      } else {
	        console.warn('controller-mapping: No mappings defined for controller type: ', controllerObj.name);
	      }
	    }

	    for (var eventName in mappingsPerController) {
	      var handler = function (event) {
	        var mapping = mappingsPerController[event.type];
	        var mappedEvent = mapping[AFRAME.currentInputMapping] ? mapping[AFRAME.currentInputMapping] : mapping.default;
	        if (mappedEvent) {
	          event.detail.target.emit(mappedEvent, event.detail);
	        }
	      };

	      controllerObj.element.addEventListener(eventName, handler);
	      controllerObj.handlers[eventName] = handler;
	    }
	  },

	  keyboardHandler: function (event) {
	    var mappings = AFRAME.inputMappings.mappings[AFRAME.currentInputMapping];

	    if (mappings && mappings.keyboard) {
	      mappings = mappings.keyboard;
	      var key = event.keyCode === 32 ? 'Space' : event.key;
	      var keyEvent = (key + '_' + event.type.substr(3)).toLowerCase();
	      var mapEvent = mappings[keyEvent];
	      if (mapEvent) {
	        this.sceneEl.emit(mapEvent);
	      }
	    }
	  },

	  updateMappingsPerController: function (mappings, mappingsPerController, mappingName) {
	    // Generate a mapping for each controller: (Eg: vive-controls.triggerdown.default.paint)
	    for (var eventName in mappings) {
	      var mapping = mappings[eventName];
	      if (!mappingsPerController[eventName]) {
	        mappingsPerController[eventName] = {};
	      }
	      mappingsPerController[eventName][mappingName] = mapping;
	    }
	  },

	  removeControllersListeners: function () {
	    for (var i = 0; i < this.loadedControllers.length; i++) {
	      var controller = this.loadedControllers[i];
	      this.removeControllerListeners(controller);
	    }
	    this.mappingsPerControllers = {};
	  }
	});

	AFRAME.registerInputMappings = function (data, override) {
	  if (override || Object.keys(AFRAME.inputMappings).length === 0) {
	    AFRAME.inputMappings = data;
	  } else {
	    // @todo Merge actions instead of replacing them with the newest
	    if (data.actions) {
	      AFRAME.inputMappings.actions = data.actions;
	    }

	    // Merge mappings
	    var mappings = data.mappings;
	    for (var mappingName in data.mappings) {
	      var mapping = data.mappings[mappingName];
	      if (!AFRAME.inputMappings.mappings[mappingName]) {
	        AFRAME.inputMappings.mappings[mappingName] = mapping;
	        continue;
	      }

	      for (var controllerName in mapping) {
	        var controllerMapping = mapping[controllerName];
	        if (!AFRAME.inputMappings.mappings[mappingName][controllerName]) {
	          AFRAME.inputMappings.mappings[mappingName][controllerName] = controllerMapping;
	          continue;
	        }

	        for (var eventName in controllerMapping) {
	          AFRAME.inputMappings.mappings[mappingName][controllerName][eventName] = controllerMapping[eventName];
	        }
	      }
	    }
	  }

	  for (var i = 0; i < AFRAME.scenes.length; i++) {
	    AFRAME.scenes[i].emit('inputmappingregistered');
	  }
	};


/***/ })
/******/ ]);