/**
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define(["./ResizeSensor.d.ts"], factory);
  } else if (typeof exports === "object") {
    module.exports = factory(require("./ResizeSensor.d.ts"));
  } else {
    root.ElementQueries = factory(root.ResizeSensor);
    root.ElementQueries.listen();
  }
})(typeof window !== "undefined" ? window : this, function (ResizeSensor) {
  /**
   *
   * @type {Function}
   * @constructor
   */
  const ElementQueries = function () {
    // <style> element with our dynamically created styles
    let cssStyleElement;

    // all rules found for element queries
    const allQueries = {};

    // association map to identify which selector belongs to a element from the animationstart event.
    const idToSelectorMapping = [];

    /**
     *
     * @param element
     * @returns {Number}
     */
    function getEmSize(element) {
      if (!element) {
        element = document.documentElement;
      }
      const {fontSize} = window.getComputedStyle(element, null);
      return parseFloat(fontSize) || 16;
    }

    /**
     * Get element size
     * @param {HTMLElement} element
     * @returns {Object} {width, height}
     */
    function getElementSize(element) {
      if (!element.getBoundingClientRect) {
        return {
          width: element.offsetWidth,
          height: element.offsetHeight,
        };
      }

      const rect = element.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }

    /**
     *
     * @copyright https://github.com/Mr0grog/element-query/blob/master/LICENSE
     *
     * @param {HTMLElement} element
     * @param {*} value
     * @returns {*}
     */
    function convertToPx(element, value) {
      const numbers = value.split(/\d/);
      const units = numbers[numbers.length - 1];
      value = parseFloat(value);
      switch (units) {
        case "px":
          return value;
        case "em":
          return value * getEmSize(element);
        case "rem":
          return value * getEmSize();
        // Viewport units!
        // According to http://quirksmode.org/mobile/tableViewport.html
        // documentElement.clientWidth/Height gets us the most reliable info
        case "vw":
          return (value * document.documentElement.clientWidth) / 100;
        case "vh":
          return (value * document.documentElement.clientHeight) / 100;
        case "vmin":
        case "vmax":
          var vw = document.documentElement.clientWidth / 100;
          var vh = document.documentElement.clientHeight / 100;
          var chooser = Math[units === "vmin" ? "min" : "max"];
          return value * chooser(vw, vh);
        default:
          return value;
        // for now, not supporting physical units (since they are just a set number of px)
        // or ex/ch (getting accurate measurements is hard)
      }
    }

    /**
     *
     * @param {HTMLElement} element
     * @param {String} id
     * @constructor
     */
    function SetupInformation(element, id) {
      this.element = element;
      let key;
      var option;
      let elementSize;
      var value;
      var actualValue;
      var attrValues;
      var attrValue;
      let attrName;

      const attributes = ["min-width", "min-height", "max-width", "max-height"];

      /**
       * Extracts the computed width/height and sets to min/max- attribute.
       */
      this.call = function () {
        // extract current dimensions
        elementSize = getElementSize(this.element);

        attrValues = {};

        for (key in allQueries[id]) {
          if (!allQueries[id].hasOwnProperty(key)) {
            continue;
          }
          option = allQueries[id][key];

          value = convertToPx(this.element, option.value);

          actualValue =
            option.property === "width"
              ? elementSize.width
              : elementSize.height;
          attrName = `${option.mode}-${option.property}`;
          attrValue = "";

          if (option.mode === "min" && actualValue >= value) {
            attrValue += option.value;
          }

          if (option.mode === "max" && actualValue <= value) {
            attrValue += option.value;
          }

          if (!attrValues[attrName]) attrValues[attrName] = "";
          if (
            attrValue &&
            (` ${  attrValues[attrName]  } `).indexOf(` ${  attrValue  } `) ===
            ) === -1
          ) {
            attrValues[attrName] += ` ${attrValue}`;
          }
        }

        for (const k in attributes) {
          if (!attributes.hasOwnProperty(k)) continue;

          if (attrValues[attributes[k]]) {
            this.element.setAttribute(
              attributes[k],
              attrValues[attributes[k]].substr(1)
            );
          } else {
            this.element.removeAttribute(attributes[k]);
          }
        }
      };
    }

    /**
     * @param {HTMLElement} element
     * @param {Object}      id
     */
    function setupElement(element, id) {
      if (!element.elementQueriesSetupInformation) {
        element.elementQueriesSetupInformation = new SetupInformation(
          element,
          id
        );
      }

      if (!element.elementQueriesSensor) {
        element.elementQueriesSensor = new ResizeSensor(element, function () {
          element.elementQueriesSetupInformation.call();
        });
      }
    }

    /**
     * Stores rules to the selector that should be applied once resized.
     *
     * @param {String} selector
     * @param {String} mode min|max
     * @param {String} property width|height
     * @param {String} value
     */
    function queueQuery(selector, mode, property, value) {
      if (typeof allQueries[selector] === "undefined") {
        allQueries[selector] = [];
        // add animation to trigger animationstart event, so we know exactly when a element appears in the DOM

        const id = idToSelectorMapping.length;
        cssStyleElement.innerHTML += `\n${selector} {animation: 0.1s element-queries;}`;
        cssStyleElement.innerHTML += `\n${selector} > .resize-sensor {min-width: ${id}px;}`;
        idToSelectorMapping.push(selector);
      }

      allQueries[selector].push({
        mode,
        property,
        value,
      });
    }

    function getQuery(container) {
      let query;
      if (document.querySelectorAll)
        query = container
          ? container.querySelectorAll.bind(container)
          : document.querySelectorAll.bind(document);
      if (!query && typeof $$ !== "undefined") query = $$;
      if (!query && typeof jQuery !== "undefined") query = jQuery;

      if (!query) {
        throw "No document.querySelectorAll, jQuery or Mootools's $$ found.";
      }

      return query;
    }

    /**
     * If animationStart didn't catch a new element in the DOM, we can manually search for it
     */
    function findElementQueriesElements(container) {
      const query = getQuery(container);

      for (const selector in allQueries)
        if (allQueries.hasOwnProperty(selector)) {
          // find all elements based on the extract query selector from the element query rule
          const elements = query(selector, container);

          for (let i = 0, j = elements.length; i < j; i++) {
            setupElement(elements[i], selector);
          }
        }
    }

    /**
     *
     * @param {HTMLElement} element
     */
    function attachResponsiveImage(element) {
      const children = [];
      const rules = [];
      const sources = [];
      let defaultImageId = 0;
      let lastActiveImage = -1;
      const loadedImages = [];

      for (const i in element.children) {
        if (!element.children.hasOwnProperty(i)) continue;

        if (
          element.children[i].tagName &&
          element.children[i].tagName.toLowerCase() === "img"
        ) {
          children.push(element.children[i]);

          const minWidth =
            element.children[i].getAttribute("min-width") ||
            element.children[i].getAttribute("data-min-width");
          // var minHeight = element.children[i].getAttribute('min-height') || element.children[i].getAttribute('data-min-height');
          const src =
            element.children[i].getAttribute("data-src") ||
            element.children[i].getAttribute("url");

          sources.push(src);

          const rule = {
            minWidth,
          };

          rules.push(rule);

          if (!minWidth) {
            defaultImageId = children.length - 1;
            element.children[i].style.display = "block";
          } else {
            element.children[i].style.display = "none";
          }
        }
      }

      lastActiveImage = defaultImageId;

      function check() {
        let imageToDisplay = false;
        var i;

        for (i in children) {
          if (!children.hasOwnProperty(i)) continue;

          if (rules[i].minWidth) {
            if (element.offsetWidth > rules[i].minWidth) {
              imageToDisplay = i;
            }
          }
        }

        if (!imageToDisplay) {
          // no rule matched, show default
          imageToDisplay = defaultImageId;
        }

        if (lastActiveImage !== imageToDisplay) {
          // image change

          if (!loadedImages[imageToDisplay]) {
            // image has not been loaded yet, we need to load the image first in memory to prevent flash of
            // no content

            const image = new Image();
            image.onload = function () {
              children[imageToDisplay].src = sources[imageToDisplay];

              children[lastActiveImage].style.display = "none";
              children[imageToDisplay].style.display = "block";

              loadedImages[imageToDisplay] = true;

              lastActiveImage = imageToDisplay;
            };

            image.src = sources[imageToDisplay];
          } else {
            children[lastActiveImage].style.display = "none";
            children[imageToDisplay].style.display = "block";
            lastActiveImage = imageToDisplay;
          }
        } else {
          // make sure for initial check call the .src is set correctly
          children[imageToDisplay].src = sources[imageToDisplay];
        }
      }

      element.resizeSensorInstance = new ResizeSensor(element, check);
      check();
    }

    function findResponsiveImages() {
      const query = getQuery();

      const elements = query("[data-responsive-image],[responsive-image]");
      for (let i = 0, j = elements.length; i < j; i++) {
        attachResponsiveImage(elements[i]);
      }
    }

    const regex = /,?[\s\t]*([^,\n]*?)((?:\[[\s\t]*?(?:min|max)-(?:width|height)[\s\t]*?[~$\^]?=[\s\t]*?"[^"]*?"[\s\t]*?])+)([^,\n\s\{]*)/gim;
    const attrRegex = /\[[\s\t]*?(min|max)-(width|height)[\s\t]*?[~$\^]?=[\s\t]*?"([^"]*?)"[\s\t]*?]/gim;

    /**
     * @param {String} css
     */
    function extractQuery(css) {
      let match;
      var smatch;
      var attrs;
      let attrMatch;

      css = css.replace(/'/g, '"');
      while ((match = regex.exec(css)) !== null) {
        smatch = match[1] + match[3];
        attrs = match[2];

        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
          queueQuery(smatch, attrMatch[1], attrMatch[2], attrMatch[3]);
        }
      }
    }

    /**
     * @param {CssRule[]|String} rules
     */
    function readRules(rules) {
      let selector = "";

      if (!rules) {
        return;
      }

      if (typeof rules === "string") {
        rules = rules.toLowerCase();
        if (
          rules.indexOf("min-width") !== -1 ||
          rules.indexOf("max-width") !== -1
        ) {
          extractQuery(rules);
        }
      } else {
        for (let i = 0, j = rules.length; i < j; i++) {
          if (rules[i].type === 1) {
            selector = rules[i].selectorText || rules[i].cssText;
            if (
              selector.indexOf("min-height") !== -1 ||
              selector.indexOf("max-height") !== -1
            ) {
              extractQuery(selector);
            } else if (
              selector.indexOf("min-width") !== -1 ||
              selector.indexOf("max-width") !== -1
            ) {
              extractQuery(selector);
            }
          } else if (rules[i].type === 4) {
            readRules(rules[i].cssRules || rules[i].rules);
          } else if (rules[i].type === 3) {
            if (rules[i].styleSheet.hasOwnProperty("cssRules")) {
              readRules(rules[i].styleSheet.cssRules);
            }
          }
        }
      }
    }

    let defaultCssInjected = false;

    /**
     * Searches all css rules and setups the event listener to all elements with element query rules..
     */
    this.init = function () {
      let animationStart = "animationstart";
      if (
        typeof document.documentElement.style.webkitAnimationName !==
        "undefined"
      ) {
        animationStart = "webkitAnimationStart";
      } else if (
        typeof document.documentElement.style.MozAnimationName !== "undefined"
      ) {
        animationStart = "mozanimationstart";
      } else if (
        typeof document.documentElement.style.OAnimationName !== "undefined"
      ) {
        animationStart = "oanimationstart";
      }

      document.body.addEventListener(animationStart, function (e) {
        const element = e.target;
        const styles = element && window.getComputedStyle(element, null);
        const animationName = styles && styles.getPropertyValue("animation-name");
        const requiresSetup =
          animationName && animationName.indexOf("element-queries") !== -1;

        if (requiresSetup) {
          element.elementQueriesSensor = new ResizeSensor(element, function () {
            if (element.elementQueriesSetupInformation) {
              element.elementQueriesSetupInformation.call();
            }
          });

          const sensorStyles = window.getComputedStyle(
            element.resizeSensor,
            null
          );
          let id = sensorStyles.getPropertyValue("min-width");
          id = parseInt(id.replace("px", ""));
          setupElement(e.target, idToSelectorMapping[id]);
        }
      });

      if (!defaultCssInjected) {
        cssStyleElement = document.createElement("style");
        cssStyleElement.type = "text/css";
        cssStyleElement.innerHTML =
          "[responsive-image] > img, [data-responsive-image] {overflow: hidden; padding: 0; } [responsive-image] > img, [data-responsive-image] > img {width: 100%;}";

        // safari wants at least one rule in keyframes to start working
        cssStyleElement.innerHTML +=
          "\n@keyframes element-queries { 0% { visibility: inherit; } }";
        document.getElementsByTagName("head")[0].appendChild(cssStyleElement);
        defaultCssInjected = true;
      }

      for (let i = 0, j = document.styleSheets.length; i < j; i++) {
        try {
          if (
            document.styleSheets[i].href &&
            document.styleSheets[i].href.indexOf("file://") === 0
          ) {
            console.warn(
              `CssElementQueries: unable to parse local css files, ${document.styleSheets[i].href}`
            );
          }

          readRules(
            document.styleSheets[i].cssRules ||
              document.styleSheets[i].rules ||
              document.styleSheets[i].cssText
          );
        } catch (e) {}
      }

      findResponsiveImages();
    };

    /**
     * Go through all collected rules (readRules()) and attach the resize-listener.
     * Not necessary to call it manually, since we detect automatically when new elements
     * are available in the DOM. However, sometimes handy for dirty DOM modifications.
     *
     * @param {HTMLElement} container only elements of the container are considered (document.body if not set)
     */
    this.findElementQueriesElements = function (container) {
      findElementQueriesElements(container);
    };

    this.update = function () {
      this.init();
    };
  };

  ElementQueries.update = function () {
    ElementQueries.instance.update();
  };

  /**
   * Removes all sensor and elementquery information from the element.
   *
   * @param {HTMLElement} element
   */
  ElementQueries.detach = function (element) {
    if (element.elementQueriesSetupInformation) {
      // element queries
      element.elementQueriesSensor.detach();
      delete element.elementQueriesSetupInformation;
      delete element.elementQueriesSensor;
    } else if (element.resizeSensorInstance) {
      // responsive image

      element.resizeSensorInstance.detach();
      delete element.resizeSensorInstance;
    }
  };

  ElementQueries.init = function () {
    if (!ElementQueries.instance) {
      ElementQueries.instance = new ElementQueries();
    }

    ElementQueries.instance.init();
  };

  const domLoaded = function (callback) {
    /* Mozilla, Chrome, Opera */
    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", callback, false);
    } else if (/KHTML|WebKit|iCab/i.test(navigator.userAgent)) {
      /* Safari, iCab, Konqueror */
      var DOMLoadTimer = setInterval(function () {
        if (/loaded|complete/i.test(document.readyState)) {
          callback();
          clearInterval(DOMLoadTimer);
        }
      }, 10);
    } else window.onload = callback;
    /* Other web browsers */
  };

  ElementQueries.findElementQueriesElements = function (container) {
    ElementQueries.instance.findElementQueriesElements(container);
  };

  ElementQueries.listen = function () {
    domLoaded(ElementQueries.init);
  };

  return ElementQueries;
});
