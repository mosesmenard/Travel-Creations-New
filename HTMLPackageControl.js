(function () {
  document.addEventListener("DOMContentLoaded", function (event) {
    GOL_Global.filterDirectOption = false;
    GOL_Global.pageYOffset = 0;
    document.getElementById("searchForm-multiCity").classList.add("hidden");

    const initialDepartureDate = new Date(
      new Date().setDate(
        new Date().getDate() + Number(GOL_Global.config.departureDate)
      )
    );

    const initialReturnDate = new Date(
      new Date(initialDepartureDate).setDate(
        new Date(initialDepartureDate).getDate() +
          Number(GOL_Global.config.durationOfStay)
      )
    );

    const isDefaultDateVariantAlternative =
      GOL_Global.config?.defaultDateVariant === "close";

    // main object containing important search data
    GOL_Global.HTMLSearchForm = {
      flights: [
        {
          key: 0,
          from: "",
          to: "",
          departure_date: new Date(initialDepartureDate),
          return_date: new Date(initialReturnDate),
        },
        {
          key: 1,
          from: "",
          to: "",
          departure_date: new Date(initialDepartureDate),
        },
      ],
      editingAirportSelect: null,
      toleranceDays: isDefaultDateVariantAlternative
        ? Number(GOL_Global.config?.maxPlusMinusDay) || 0
        : 0,
      max_transfers: undefined,
      preferred_airline: undefined,
      properties: {
        passengerCount: {
          ADT: 1,
          INF: 0,
          CHD: 0,
          YCD: 0,
          YTH: 0,
        },
        class: {
          key: "ECO",
          label: GOL_Global.textStorage["SearchForm.classEconomy"],
        },
      },
      typeSearch: "RETURN", // RETURN, ONEWAY, MULTIPLE
    };

    updateProperties("#searchForm-standard");
    updateDates("departure_date");
    updateDates("return_date");
    updateDates("departure_date_0");
    updateDates("departure_date_1");
    hideHotelsTab();

    initProperties();
    toggleProperties("#searchForm-standard");
    onToggleProperties("#searchForm-standard");
    onPropertiesDoneButton("#searchForm-standard");
    onToggleClass("#searchForm-standard");
    onToggleClass("#searchForm-multiCity");

    onOnewayTabClick();
    onReturnTabClick();
    onMultiTabClick();
    onDifferentReturnAirportClick();

    ["ADT", "INF", "CHD", "YCD", "YTH"].forEach((type) => {
      onPropertiesRemoveBtn(type, "#searchForm-standard");
      onPropertiesAddBtn(type, "#searchForm-standard");
    });

    onToggleDirectFlights("header-search-form-only-direct");
    onToggleDirectFlights("header-search-form-only-direct-mobile");

    multiCity();
    onToggleCalendar();
    getCalendarDays();
    createAirportSelectControl("airport-select-from");
    createAirportSelectControl("airport-select-to");

    useGlobalGOLConfig();
    getCountries();

    onSubmitMobile();
    onSubmitDesktop();
  });

  const THRESHOLD_WIDTH_DESKTOP_PX = 960;

  function hideHotelsTab() {
    const hotelsTab = document.querySelector(".header-search-form-tab-hotels");
    if (hotelsTab) {
      hotelsTab.remove();
    }
  }

  function hideOnClickOutside(element) {
    const outsideClickListener = (event) => {
      if ((!element || !element.contains(event.target)) && isVisible(element)) {
        // or use: event.target.closest(selector) === null
        element.style.display = "none";
        removeClickListener();
      }
    };

    const removeClickListener = () => {
      document.removeEventListener("click", outsideClickListener);
    };

    document.addEventListener("click", outsideClickListener);
  }

  const isVisible = (elem) =>
    !!elem &&
    !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);

  /* create HTML based on global GOL config */
  function useGlobalGOLConfig() {
    useGlobalGOLConfigPassiveSessionId();
    useGlobalGOLConfigDefaultAirports();
    useGlobalGOLConfigPlusMinusDays();
    useGlobalGOLConfigPlusMinusDays("-mobile");
    useGlobalGOLConfigTransportCompanies("GOL_package-search-airlines");
    useGlobalGOLConfigTransportCompanies("GOL_package-search-airlines-mobile");
    useGlobalGOLConfigTextStorage();
  }

  function useGlobalGOLConfigPassiveSessionId() {
    GOL_Global.config.passiveSessionId = `3${generateRandomNumber(
      10000000,
      99999999
    )}`;
  }

  function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function useGlobalGOLConfigDefaultAirports() {
    const { defaultAirports } = GOL_Global.config;

    if (
      !GOL_Global.config.defaultAirports ||
      GOL_Global.config.defaultAirports.length === 0
    ) {
      return;
    }

    const fromCities = formatCityLabel(defaultAirports[0].$t);
    const fromCodes = defaultAirports[0].Code;

    GOL_Global.HTMLSearchForm.flights[0].from = fromCodes;

    const originAirportsElement = document.querySelectorAll("#from-value");
    originAirportsElement[0].children[0].innerHTML = fromCities;
    if (originAirportsElement[0].children[1]) {
      originAirportsElement[0].children[1].innerHTML = `(${fromCodes})`;
    }

    const multiCityOriginAirportsElementWrapper = document.querySelectorAll(
      "#airport-select-from-0 > div"
    );

    const multiCityOriginAirportsElement =
      multiCityOriginAirportsElementWrapper[0].children[1];
    multiCityOriginAirportsElement.innerHTML = `<span role="button" id="from-value"><span class="header-search-form-inner-field-value">${fromCities}</span> <span class="header-search-form-inner-field-additional"> (${fromCodes})</span></span>`;
  }

  function useGlobalGOLConfigPlusMinusDays(type = "") {
    if (!GOL_Global.config.enablePlusMinusDays) {
      removeElement(`GOL_package-variableDays${type}`);
    }

    createPlusMinusDaysPlusHandler(type);
    createPlusMinusDaysMinusHandler(type);

    setToleranceDays(type);
  }

  function createPlusMinusDaysPlusHandler(type = "") {
    const plusMinusDaysPlusHandlerElement = document.getElementById(
      `GOL_package-variableDays-plus${type}`
    );

    if (!plusMinusDaysPlusHandlerElement) {
      return;
    }

    const plusMinusDaysMinusHandlerElement = document.getElementById(
      `GOL_package-variableDays-minus${type}`
    );

    if (
      GOL_Global.HTMLSearchForm.toleranceDays ===
      GOL_Global.config?.maxPlusMinusDay
    ) {
      plusMinusDaysPlusHandlerElement.classList.add("counter-sign-disabled");
    } else {
      plusMinusDaysPlusHandlerElement.classList.remove("counter-sign-disabled");
    }

    plusMinusDaysPlusHandlerElement.onclick = function () {
      plusMinusDaysMinusHandlerElement.classList.remove(
        "header-search-form-additional-bottom-tolerance--disabled"
      );
      if (
        GOL_Global.HTMLSearchForm.toleranceDays + 1 >
        GOL_Global.config.maxPlusMinusDay
      ) {
        return;
      }

      GOL_Global.HTMLSearchForm.toleranceDays =
        GOL_Global.HTMLSearchForm.toleranceDays + 1;
      setToleranceDays(type);
    };
  }

  const handleDisabledToleranceDaysButtons = (type) => {
    const plusMinusDaysMinusHandlerElement = document.getElementById(
      `GOL_package-variableDays-minus${type}`
    );

    const plusMinusDaysPlusHandlerElement = document.getElementById(
      `GOL_package-variableDays-plus${type}`
    );

    if (
      GOL_Global.HTMLSearchForm.toleranceDays ===
      GOL_Global.config?.maxPlusMinusDay
    ) {
      plusMinusDaysPlusHandlerElement.classList.add("counter-sign-disabled");
    } else {
      plusMinusDaysPlusHandlerElement.classList.remove("counter-sign-disabled");
    }

    if (GOL_Global.HTMLSearchForm.toleranceDays === 0) {
      plusMinusDaysMinusHandlerElement.classList.add("counter-sign-disabled");
    } else {
      plusMinusDaysMinusHandlerElement.classList.remove(
        "counter-sign-disabled"
      );
    }
  };

  function createPlusMinusDaysMinusHandler(type = "") {
    const plusMinusDaysMinusHandlerElement = document.getElementById(
      `GOL_package-variableDays-minus${type}`
    );

    if (!plusMinusDaysMinusHandlerElement) {
      return;
    }

    plusMinusDaysMinusHandlerElement.onclick = function () {
      if (GOL_Global.HTMLSearchForm.toleranceDays - 1 < 0) {
        return;
      }

      plusMinusDaysMinusHandlerElement.classList.remove(
        "header-search-form-additional-bottom-tolerance--disabled"
      );

      GOL_Global.HTMLSearchForm.toleranceDays =
        GOL_Global.HTMLSearchForm.toleranceDays - 1;
      if (GOL_Global.HTMLSearchForm.toleranceDays === 0) {
        plusMinusDaysMinusHandlerElement.classList.add(
          "header-search-form-additional-bottom-tolerance--disabled"
        );
      }
      setToleranceDays(type);
    };
  }

  function setToleranceDays(type) {
    const variableDays = document.getElementById(
      `GOL_package-variableDays-value`
    );
    const variableDaysMobile = document.getElementById(
      `GOL_package-variableDays-value-mobile`
    );

    if (!variableDays || !variableDaysMobile) {
      return;
    }

    let translation;

    const toleranceText = document.querySelector(
      ".header-search-form-additional-desktop-one-tolerance-inner-label"
    );
    toleranceText.innerHTML = `${GOL_Global.textStorage["SearchForm.tolerance"]}:`;

    switch (GOL_Global.HTMLSearchForm.toleranceDays) {
      case 1:
        translation = GOL_Global.textStorage["FilterBar.htmlPackageDay"];
        break;
      case 0:
        translation = GOL_Global.textStorage["FilterBar.htmlPackageDaysOther"];
        break;
      default:
        translation = GOL_Global.textStorage["FilterBar.htmlPackageDays"];
        break;
    }

    handleDisabledToleranceDaysButtons(type);
    variableDays.innerHTML = `${GOL_Global.HTMLSearchForm.toleranceDays} ${translation}`;
    variableDaysMobile.innerHTML = `${GOL_Global.HTMLSearchForm.toleranceDays} ${translation}`;
  }

  function useGlobalGOLConfigTransportCompanies(id) {
    const transportCompaniesWrapper = document.getElementById(id);

    transportCompaniesWrapper.style.opacity = 1;
    transportCompaniesWrapper.onclick = function (e) {
      e.stopPropagation();
      showTransportCompaniesSelect(
        transportCompaniesWrapper.getBoundingClientRect()
      );
    };
  }

  function showTransportCompaniesSelect(position) {
    let transportCompaniesSelectWrapper = document.getElementById(
      "GOL_package-search-airlines-wrapper"
    );

    if (!transportCompaniesSelectWrapper) {
      transportCompaniesSelectWrapper = document.createElement("div");
      transportCompaniesSelectWrapper.className = "select-menu-outer";
      transportCompaniesSelectWrapper.id =
        "GOL_package-search-airlines-wrapper";

      transportCompaniesSelectWrapper.style.backgroundColor = "white";
      document.body.appendChild(transportCompaniesSelectWrapper);
    }

    transportCompaniesSelectWrapper.style.display = "block";
    transportCompaniesSelectWrapper.style.position = "absolute";
    transportCompaniesSelectWrapper.style.top = `${
      position.top + GOL_Global.pageYOffset + 31
    }px`;

    transportCompaniesSelectWrapper.style.left = `${
      position.left + 306 > getPageWidth()
        ? getPageWidth() - 306 - 20
        : position.left - 20
    }px`;

    transportCompaniesSelectWrapper.style.width = "306px";
    transportCompaniesSelectWrapper.style.minHeight = "50px";
    transportCompaniesSelectWrapper.style.maxHeight = "201px";
    transportCompaniesSelectWrapper.style.overflowY = "auto";

    transportCompaniesSelectWrapper.innerHTML = "";
    hideOnClickOutside(transportCompaniesSelectWrapper);

    const allTransportCompanies = getAllTransportCompanies();

    for (let i = 0; i < allTransportCompanies.length; i++) {
      const transportCompanyDiv = document.createElement("div");

      if (allTransportCompanies[Number(i)].isDisabled) {
        transportCompanyDiv.innerHTML = `<div role="button" class="header-search-form-option " style="pointer-events: none"/>`;
      } else {
        transportCompanyDiv.innerHTML = `<div role="button" class="header-search-form-option " data-selected-airline-code="${
          allTransportCompanies[Number(i)].value
        }" data-selected-airline-title="${
          allTransportCompanies[Number(i)].label
        }">${allTransportCompanies[Number(i)].label}</div>`;
      }

      transportCompanyDiv.onclick = function (e) {
        const selectedTransportCompanyData = e.target.dataset;
        GOL_Global.HTMLSearchForm.preferred_airline =
          selectedTransportCompanyData.selectedAirlineCode;

        const selectedTransportCompanyLabel = document
          .getElementById("GOL_package-search-airlines")
          .querySelectorAll(":scope > div > div > div")[0];
        selectedTransportCompanyLabel.innerHTML =
          selectedTransportCompanyData.selectedAirlineTitle;
        const selectedTransportCompanyLabelMobile = document
          .getElementById("GOL_package-search-airlines-mobile")
          .querySelectorAll(":scope > div > div > div")[0];
        selectedTransportCompanyLabelMobile.innerHTML =
          selectedTransportCompanyData.selectedAirlineTitle;

        document.getElementById(
          "GOL_package-search-airlines-wrapper"
        ).style.display = "none";
      };
      transportCompaniesSelectWrapper.appendChild(transportCompanyDiv);
    }
  }

  function getAllTransportCompanies() {
    if (!GOL_Global.config.transportCompanies) {
      return [];
    }

    return [
      { label: GOL_Global.textStorage["FilterBar.allAirlines"], value: "" },
    ].concat(GOL_Global.config.transportCompanies);
  }

  function useGlobalGOLConfigTextStorage() {
    const allDefinedGOLConfigTextStorageTexts = Object.keys(
      GOL_Global.textStorage
    );

    allDefinedGOLConfigTextStorageTexts.forEach((textStorageKey) => {
      const allTextsElements = document.querySelectorAll(
        `[id*="GOL_package-textStorage-${textStorageKey}"], [class*="GOL_package-textStorage-${textStorageKey}"]`
      );

      allTextsElements.forEach((textElement) => {
        textElement.innerHTML = GOL_Global.textStorage[`${textStorageKey}`];
      });
    });

    const removeBtn = document.getElementsByClassName(
      "GOL_package-textStorage-SearchForm.remove"
    );

    if (removeBtn) {
      for (let i = 0; i < removeBtn.length; i++) {
        if (removeBtn[i].className.includes("minus")) {
          removeBtn[i].innerHTML = GOL_Global.textStorage["SearchForm.remove"];
        }
      }
    }

    // selected transport company text is defined differently
    if (
      GOL_Global.HTMLSearchForm.preferred_airline === undefined ||
      GOL_Global.HTMLSearchForm.preferred_airline.length === 0
    ) {
      const selectedTransportCompanyLabel = document
        .getElementById("GOL_package-search-airlines")
        .querySelectorAll(":scope > div > div > div")[0];
      selectedTransportCompanyLabel.innerHTML =
        GOL_Global.textStorage["FilterBar.allAirlines"];
      const selectedTransportCompanyLabelMobile = document
        .getElementById("GOL_package-search-airlines-mobile")
        .querySelectorAll(":scope > div > div > div")[0];
      selectedTransportCompanyLabelMobile.innerHTML =
        GOL_Global.textStorage["FilterBar.allAirlines"];
    }

    // change placeholder of all airports selectboxes
    const airportSelectsPlaceholders = document.body.querySelectorAll(
      ".react-select-2-placeholder"
    );
    airportSelectsPlaceholders.forEach((airportSelectPlaceholder) => {
      airportSelectPlaceholder.innerHTML =
        GOL_Global.textStorage["AirportSelect.placeholder"];
    });
  }

  let additionalRow;

  function multiCity() {
    const row = document.getElementById("searchForm-multiCity-row-1");
    const clonedRow = row.cloneNode(true);
    additionalRow = document
      .getElementById("searchForm-multiCity-row-1")
      .cloneNode(true);
    const btn = document.getElementById("searchForm-multiCity-button-add-1");
    const btnRmv = document.getElementById(
      "searchForm-multiCity-button-remove-1"
    );
    const container = document.getElementById("searchForm-multiCity");

    initCalendar(`departure_date_0`);
    initCalendar(`departure_date_1`);
    createAirportSelectControl("airport-select-from-0");
    createAirportSelectControl("airport-select-to-0");
    createAirportSelectControl("airport-select-from-1");
    createAirportSelectControl("airport-select-to-1");
    onRemoveButton(btnRmv, btn, container, 1, "departure_date_1", clonedRow);

    onAddFlightButton(btn, clonedRow, 2);
  }

  function initCalendar(calendarId) {
    let isVisible = false;
    document.getElementById(calendarId).addEventListener("click", function (e) {
      e.stopPropagation();
      makeCalendar(calendarId);
      isVisible = true;
      removeCalendar(isVisible);
    });
  }

  function getFlightObjectByKey(i) {
    return GOL_Global.HTMLSearchForm.flights.find((flight) => flight.key === i);
  }

  function getKeyFromID(id) {
    const a = id.match(/\d+$/) ?? 0;
    return parseInt(a, 10);
  }

  function createMultiRow(newRow, rowIndex) {
    newRow.id = `searchForm-multiCity-row-${rowIndex}`;
    newRow.querySelector(
      `#searchForm-multiCity-row-${rowIndex} #searchForm-multiCity-button-add-1`
    ).id = `searchForm-multiCity-button-add-${rowIndex}`;
    newRow.querySelector(
      `#searchForm-multiCity-row-${rowIndex} #searchForm-multiCity-button-remove-1`
    ).id = `searchForm-multiCity-button-remove-${rowIndex}`;
    newRow.querySelector(
      `#searchForm-multiCity-row-${rowIndex} #departure_date_1`
    ).id = `departure_date_${rowIndex}`;

    newRow.querySelector(
      `#searchForm-multiCity-row-${rowIndex} .header-search-form-multiple-add .header-search-form-multiple-add-inner-container-minus`
    ).children[1].id = `GOL_package-textStorage-SearchForm.remove-${rowIndex}`;

    newRow.querySelector(
      `#searchForm-multiCity-row-${rowIndex} .header-search-form-multiple-add .header-search-form-multiple-add-inner-container-plus`
    ).children[1].id = `GOL_package-textStorage-SearchForm.anotherFlight-${rowIndex}`;

    newRow.querySelector(
      `#searchForm-multiCity-row-${rowIndex} #airport-select-from-1`
    ).id = `airport-select-from-${rowIndex}`;
    newRow.querySelector(
      `#searchForm-multiCity-row-${rowIndex} #airport-select-to-1`
    ).id = `airport-select-to-${rowIndex}`;
  }

  function onAddFlightButton(btn, row, rowIndex) {
    if (!btn) {
      return;
    }
    const container = document.getElementById("searchForm-multiCity");
    const MAXIMUM_ROWS = 8;
    if (container.children.length - 1 >= MAXIMUM_ROWS) {
      return;
    }
    btn.addEventListener("click", () => {
      const newRow = row ? row.cloneNode(true) : additionalRow;
      createMultiRow(newRow, rowIndex);

      const divider = createElementWithClasses(
        "div",
        "header-search-form-multiple-divider"
      );
      const secondToLastRow = container.children[container.children.length - 2];
      secondToLastRow.append(divider);

      btn.parentElement.children[1].remove();
      btn.remove();
      container.insertBefore(
        newRow,
        container.children[container.children.length - 1]
      );

      const lastFlight = GOL_Global.HTMLSearchForm.flights.slice(-1)[0];

      GOL_Global.HTMLSearchForm.flights.push({
        key: rowIndex,
        from: "",
        to: "",
        departure_date: new Date(lastFlight.departure_date),
      });
      initCalendar(`departure_date_${rowIndex}`);
      updateDates(`departure_date_${rowIndex}`);
      createAirportSelectControl(`airport-select-from-${rowIndex}`);
      createAirportSelectControl(`airport-select-to-${rowIndex}`);

      const btnRmv = document.getElementById(
        `searchForm-multiCity-button-remove-${rowIndex}`
      );

      if (btnRmv) {
        onRemoveButton(
          btnRmv,
          btn,
          container,
          rowIndex,
          `departure_date_${rowIndex}`
        );
      }
      const newBtn = document.getElementById(
        `searchForm-multiCity-button-add-${rowIndex}`
      );
      useGlobalGOLConfigTextStorage();
      onAddFlightButton(newBtn, row, rowIndex + 1);
    });
  }

  function onRemoveButton(btnRmv, btn, container, i, calendarId, clonedRow) {
    btnRmv.addEventListener("click", function () {
      const lastEl = container.children[container.children.length - 2].id;
      const lastElId = getKeyFromID(lastEl);
      document.getElementById(`searchForm-multiCity-row-${i}`).remove();
      if (calendarId) {
        const key = getKeyFromID(calendarId);
        GOL_Global.HTMLSearchForm.flights = GOL_Global.HTMLSearchForm.flights.filter(
          (obj) => obj.key !== key
        );
      }
      const collectionLength = container.children.length - 1;
      if (i === lastElId || collectionLength === 1) {
        const a = container.children[container.children.length - 2];
        const ab = parseInt(a.id.match(/\d/g).join(""), 10);
        const lastRow = document.querySelector(
          `#searchForm-multiCity-row-${ab}`
        );
        const plusButtonText = document.createElement("span");
        plusButtonText.className =
          "header-search-form-multiple-add-plus-button-label GOL_package-textStorage-SearchForm.anotherFlight";
        plusButtonText.appendChild(
          document.createTextNode(
            GOL_Global.textStorage["SearchForm.anotherFlight"]
          )
        );
        const isLastRow = lastRow.querySelector(
          `.header-search-form-multiple-add-inner-container-plus`
        );
        if (isLastRow) {
          lastRow
            .querySelector(
              `.header-search-form-multiple-add-inner-container-plus`
            )
            .append(btn);
          lastRow
            .querySelector(
              ".header-search-form-multiple-add-inner-container-plus"
            )
            .appendChild(plusButtonText);
          lastRow
            .querySelector(".header-search-form-multiple-divider")
            .remove();
        } else {
          const plusButtonContainer = document.createElement("div");
          plusButtonContainer.setAttribute("role", "button");
          plusButtonContainer.classList.add(
            "header-search-form-multiple-add-inner-container-plus"
          );
          const plusButtonImg = document.createElement("img");
          plusButtonImg.className = `header-search-form-multiple-add-inner-image`;
          plusButtonImg.src = "/static/images/ico-plus.svg";
          plusButtonImg.id = `searchForm-multiCity-button-add-${i}`;
          plusButtonImg.alt = "plus icon";
          const plusButtonText = document.createElement("span");
          plusButtonText.id = `GOL_package-textStorage-SearchForm.anotherFlight-${i}`;
          plusButtonText.className =
            "header-search-form-multiple-add-plus-button-label GOL_package-textStorage-SearchForm.anotherFlight";
          plusButtonText.appendChild(
            document.createTextNode(
              GOL_Global.textStorage["SearchForm.anotherFlight"]
            )
          );
          plusButtonContainer.appendChild(plusButtonImg);
          plusButtonContainer.appendChild(plusButtonText);
          const parentElement = document.querySelector(
            "#searchForm-multiCity-row-0 .header-search-form-multiple-add"
          );
          const lastChildIndex = parentElement.children.length - 1;
          const divider = lastRow.querySelector(
            ".header-search-form-multiple-divider"
          );
          parentElement.insertBefore(
            plusButtonContainer,
            parentElement.children[lastChildIndex]
          );
          divider.remove();
          plusButtonContainer.addEventListener("click", function () {
            const newBtn = document.getElementById(
              `searchForm-multiCity-button-add-${i}`
            );
            useGlobalGOLConfigTextStorage();
            onAddFlightButton(newBtn, clonedRow || additionalRow, i + 1);
          });
        }
      }
    });
  }

  function updateProperties(formType) {
    const classProperties = document.querySelector(
      `${formType} #search-properties-singleValue > div`
    );
    classProperties.innerHTML = GOL_Global.HTMLSearchForm.properties.class.label.toUpperCase();
    const classForm = document.querySelector(
      `${formType} #header-search-form-div_toggle_properties`
    );

    ["ADT", "INF", "CHD", "YCD", "YTH"].forEach((type) => {
      document.querySelector(
        `${formType} #properties_counter_${type}_value`
      ).innerHTML =
        GOL_Global.HTMLSearchForm.properties.passengerCount[`${type}`];
    });

    const numPassengers = countProperties();
    const passengersLabel =
      numPassengers === 1
        ? GOL_Global.textStorage["PropertiesSelect.OnePassenger"]
        : numPassengers < 4
        ? GOL_Global.textStorage["PropertiesSelect.TwoThreePassengers"]
        : GOL_Global.textStorage["PropertiesSelect.FourPlusPassengers"];

    if (numPassengers === 9) {
      [("ADT", "INF", "CHD", "YCD", "YTH")].forEach((type) => {
        document
          .querySelector(`${formType} #properties_counter_${type}_plus`)
          .classList.add("counter-sign-disabled");
      });
    } else if (numPassengers === 1) {
      ["ADT", "INF", "CHD", "YCD", "YTH"].forEach((type) => {
        document
          .querySelector(`${formType} #properties_counter_${type}_minus`)
          .classList.add("counter-sign-disabled");
        document
          .querySelector(`${formType} #properties_counter_${type}_plus`)
          .classList.remove("counter-sign-disabled");
      });
    } else {
      ["ADT", "INF", "CHD", "YCD", "YTH"].forEach((type) => {
        document
          .querySelector(`${formType} #properties_counter_${type}_minus`)
          .classList.remove("counter-sign-disabled");
      });
    }

    classForm.children[0].innerHTML = `${countProperties()} ${passengersLabel}`;
    classForm.children[1].innerHTML = GOL_Global.HTMLSearchForm.properties.class.label.toUpperCase();
  }

  function updateDates(calendarId) {
    const key = getKeyFromID(calendarId);
    const flightObject = getFlightObjectByKey(key);

    const type = calendarId.includes("return") ? "return" : "departure";
    let flightIndex = GOL_Global.HTMLSearchForm.flights.indexOf(flightObject);
    let nextFlightObjIndex = flightIndex + 1;
    const nextFlightObj =
      GOL_Global.HTMLSearchForm.flights[Number(nextFlightObjIndex)];
    if (
      nextFlightObj &&
      flightObject.departure_date > nextFlightObj.departure_date
    ) {
      GOL_Global.HTMLSearchForm.flights.fill(
        (nextFlightObj.departure_date = new Date(flightObject.departure_date)),
        nextFlightObjIndex,
        nextFlightObjIndex++
      );
      const nextCalendarId = `departure_date_${nextFlightObj.key}`;

      updateDateDiv(nextCalendarId, nextFlightObj.departure_date);
      updateDates(nextCalendarId);
    }

    if (
      key === 0 &&
      new Date(flightObject.departure_date) > new Date(flightObject.return_date)
    ) {
      GOL_Global.HTMLSearchForm.flights.fill(
        (flightObject.return_date = new Date(flightObject.departure_date)),
        flightIndex,
        flightIndex++
      );
      updateDateDiv("departure_date", flightObject.departure_date);
      updateDateDiv("departure_date_0", flightObject.departure_date);
      updateDateDiv("return_date", flightObject.return_date);
    }

    const i = type === "return" ? "return_date" : "departure_date";

    if (calendarId === "departure_date") {
      updateDateDiv("departure_date_0", flightObject.departure_date);
    } else if (calendarId === "departure_date_0") {
      updateDateDiv("departure_date", flightObject.departure_date);
    }
    updateDateDiv(calendarId, flightObject[i]);
  }

  function languageToLocale(language) {
    return language === "sr" ? "sr-Latn" : language;
  }
  const translates = {
    weekday: {
      al: ["Diela", "Hëna", "Marta", "Mërkura", "Enjtja", "Premtja", "Shtuna"],
    },
    month: {
      al: [
        "Janar",
        "Shkurt",
        "Mars",
        "Pril",
        "Maj",
        "Qërshr",
        "Korrik",
        "Gush",
        "Shtator",
        "Teto",
        "Nëntor",
        "Dhjetor",
      ],
    },
  };

  function getWeekday(date, lang) {
    if (["al", "sq"].includes(lang.toLowerCase())) {
      return translates.weekday.al[date.getDay()].substring(0, 2);
    }

    const result = date
      .toLocaleString(languageToLocale(GOL_Global.config.lang), {
        weekday: "short",
      })
      .substring(0, 2);

    return capitalize(result);
  }

  function getMonth(date, lang) {
    if (["al", "sq"].includes(lang)) {
      return translates.month.al[date.getMonth()];
    }

    return date.toLocaleString(languageToLocale(lang), {
      month: "long",
    });
  }

  function getCaptionElement(date, lang) {
    return `${capitalize(getMonth(date, lang))} ${date.getFullYear()}`;
  }

  function updateDateDiv(calendarId, date) {
    const els = document.getElementById(calendarId).children;
    els[0].children[0].innerHTML = getWeekday(date, GOL_Global.config.lang);
    els[0].children[2].innerHTML = formatDate(date);
  }

  function formatDate(date) {
    const d = new Date(date);
    let month = `${d.getMonth() + 1}`;
    let day = `${d.getDate()}`;
    const year = d.getFullYear();

    if (month.length < 2) month = `0${month}`;
    if (day.length < 2) day = `0${day}`;

    return [day, month, year].join(".");
  }

  function onToggleCalendar() {
    initCalendar("departure_date");
    initCalendar("return_date");
  }

  function removeCalendar(isVisible) {
    document
      .getElementById("calendar")
      .addEventListener("click", function (event) {
        event.preventDefault();
        const calendarBody = document.getElementsByClassName(
          "header-search-form-calendar"
        )[0];
        if (calendarBody === undefined) return null;
        const isClickInside = calendarBody.contains(event.target);
        if (!isClickInside && isVisible) {
          const calendar = document.getElementById("calendar");
          calendar.remove();
        }
      });
  }

  function getCalendarDays(type = "short") {
    const dt = new Date();
    const mondayIndex = 1;
    while (dt.getDay() !== mondayIndex) {
      dt.setDate(dt.getDate() - 1);
    }

    const arr = [];

    for (let i = 0; i < 7; i++) {
      arr.push(getWeekday(dt, GOL_Global.config.lang));
      dt.setDate(dt.getDate() + 1);
    }

    return arr;
  }

  function makeCalendar(calendarId) {
    const body = document.getElementsByTagName("body")[0];
    const backdrop = document.createElement("div");
    backdrop.classList.add("loader-wrapper-mini");

    const modalBody = createElementWithClasses("div", [
      "header-search-form-calendar-months",
      "header-search-form-calendar",
    ]);

    modalBody.style.cssText = `margin-top: ${GOL_Global.pageYOffset}px; top: 20%; text-align: center;right: 0;left: 0;position:absolute;max-width:1160px;min-height:460px;background-Color:white;z-index: 3;margin-left: auto;margin-right: auto; font: 13pt Muli;color: #131f6b`;

    const type = calendarId.includes("return") ? "return" : "departure";
    const calendarBody = document.createElement("div");
    calendarBody.id = "calendar";
    calendarBody.setAttribute("type", `${type}_date`);
    const titleStripe = createElementWithClasses(
      "div",
      "header-search-form-calendar-title"
    );

    if (type === "return") {
      titleStripe.innerHTML =
        GOL_Global.textStorage["SearchForm.selectReturnDate"];
    } else {
      titleStripe.innerHTML =
        GOL_Global.textStorage["SearchForm.selectDepartureDate"];
    }

    setTimeout(() => {
      const dayPickerWeekDays = document.querySelectorAll(
        ".DayPicker-Week > .DayPicker-Weekday"
      );

      const calendarDays = getCalendarDays();

      dayPickerWeekDays.forEach((weekDayElement, index) => {
        let indexDay = index % 7;
        if (indexDay === 7) {
          indexDay = 0;
        }
        weekDayElement.innerHTML = calendarDays[Number(indexDay)];
      });
    }, 10);

    const DayPickerWrapper = createElementWithClasses("div", [
      "DayPicker-wrapper",
      "DayPicker-htmlPackage-custom-height",
    ]);

    DayPickerWrapper.style.height = "345px";

    // Buttons
    const ButtonWrapper = createElementWithClasses("div");
    const BtnPrevious = createElementWithClasses("div", [
      "header-search-form-calendar-month-title-link",
      "previous",
      "link",
    ]);

    BtnPrevious.id = "button-previous";

    const BtnNext = createElementWithClasses("div", [
      "header-search-form-calendar-month-title-link",
      "next",
      "link",
    ]);
    BtnNext.id = "button-next";
    const arrow = document.createElement("img");
    arrow.src = "static/images/ico-arrow-down.svg";
    arrow.className = "header-search-form-calendar-month-title-link-next";

    BtnNext.appendChild(arrow);

    const arrowPrevious = arrow.cloneNode(true);

    arrowPrevious.className =
      "header-search-form-calendar-month-title-link-previous";
    BtnPrevious.appendChild(arrowPrevious);

    const key = getKeyFromID(calendarId);
    const flightObj = getFlightObjectByKey(key);
    const flightDate = flightObj[`${type}_date`];
    const date = new Date(flightDate.getFullYear(), flightDate.getMonth());
    ButtonWrapper.setAttribute("date", date.toUTCString());

    ButtonWrapper.appendChild(BtnPrevious);
    ButtonWrapper.appendChild(BtnNext);
    DayPickerWrapper.appendChild(ButtonWrapper);
    BtnPrevious.addEventListener("click", function () {
      const currentDate = new Date(ButtonWrapper.getAttribute("date"));
      const newDate = new Date(
        currentDate.setMonth(currentDate.getMonth() - 1)
      );
      const DayPickerMonths = makeCalendarSection(newDate, calendarId);
      ButtonWrapper.setAttribute("date", currentDate.toUTCString());
      DayPickerWrapper.appendChild(DayPickerMonths);
      modalBody.appendChild(DayPickerWrapper);
    });
    BtnNext.addEventListener("click", function () {
      const currentDate = new Date(ButtonWrapper.getAttribute("date"));
      const newDate = new Date(
        currentDate.setMonth(currentDate.getMonth() + 1)
      );
      const DayPickerMonths = makeCalendarSection(newDate, calendarId);
      ButtonWrapper.setAttribute("date", currentDate.toUTCString());
      DayPickerWrapper.appendChild(DayPickerMonths);
      modalBody.appendChild(DayPickerWrapper);
    });

    const DayPickerMonths = makeCalendarSection(date, calendarId);

    DayPickerWrapper.appendChild(DayPickerMonths);

    modalBody.appendChild(titleStripe);
    modalBody.appendChild(DayPickerWrapper);
    const closeCross = createElementWithClasses("span", "modal-close-btn");
    closeCross.onclick = function () {
      const calendar = document.getElementById("calendar");
      calendar.remove();
    };
    modalBody.appendChild(closeCross);
    calendarBody.appendChild(backdrop);
    calendarBody.appendChild(modalBody);

    body.appendChild(calendarBody);
  }

  function makeCalendarSection(currentMonth, calendarId) {
    let DayPickerMonths = document.getElementsByClassName("DayPicker-Months");
    for (const item of DayPickerMonths) {
      item.remove();
    }
    DayPickerMonths = createElementWithClasses("div", "DayPicker-Months");
    const DayPickerMonth = getMonthSection(currentMonth, calendarId);

    const nextMonthDate = new Date(currentMonth.toUTCString());
    nextMonthDate.setMonth(currentMonth.getMonth() + 1);
    const DayPickerMonth2 = getMonthSection(nextMonthDate, calendarId);

    DayPickerMonths.appendChild(DayPickerMonth);
    if (window?.innerWidth > THRESHOLD_WIDTH_DESKTOP_PX) {
      DayPickerMonths.appendChild(DayPickerMonth2);
    }

    return DayPickerMonths;
  }

  function createElementWithClasses(type, classes = []) {
    const parsedClasses = Array.isArray(classes) ? classes : [classes];
    const el = document.createElement("div");
    el.classList.add(...parsedClasses);
    return el;
  }

  function daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getMonthSection(date, calendarId) {
    const key = getKeyFromID(calendarId);
    const flightObj = getFlightObjectByKey(key);
    const type = calendarId.includes("return") ? "return" : "departure";
    const selectedDate = flightObj[`${type}_date`];

    const DayPickerMonth = createElementWithClasses("div", "DayPicker-Month");

    const DayPickerCaption = createElementWithClasses("div", [
      "DayPicker-Caption",
      "header-search-form-calendar-month-title-text",
    ]);
    DayPickerCaption.innerHTML = getCaptionElement(
      date,
      GOL_Global.config.lang
    );

    const DayPickerWeekdays = createElementWithClasses(
      "div",
      "DayPicker-Weekdays"
    );
    const DayPickerWeekdaysRow = createElementWithClasses(
      "div",
      "DayPicker-WeekdaysRow"
    );
    const DayPickerWeekday = document.createElement("div");

    const DayPickerBody = createElementWithClasses("div", "DayPicker-Body");

    const days = daysInMonth(date.getMonth(), date.getFullYear());

    const shiftedFirstDayOfMonth =
      new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1;
    const isFirstDayOfMonthSunday = shiftedFirstDayOfMonth === -1;

    // we always start week with Monday, so need to redefine Sunday as last
    const firstDayOfMonth = isFirstDayOfMonthSunday
      ? 6
      : shiftedFirstDayOfMonth;
    const calendarDays = getCalendarDays();

    const DayPickerWeekTitle = createElementWithClasses(
      "div",
      "DayPicker-Week"
    );
    for (const day of calendarDays) {
      const DayPickerDay = createElementWithClasses("div", "DayPicker-Weekday");
      DayPickerDay.innerHTML = day;
      DayPickerWeekTitle.appendChild(DayPickerDay);
    }
    DayPickerBody.appendChild(DayPickerWeekTitle);

    for (let week = 0; week < (days + firstDayOfMonth) / 7; week++) {
      const DayPickerWeek = createElementWithClasses("div", "DayPicker-Week");

      for (
        let i = week * 7 + 1;
        i <= week * 7 + 7 && i <= days + firstDayOfMonth;
        i++
      ) {
        const dayDate = new Date(
          `${date.getFullYear()}/${date.getMonth() + 1}/${i - firstDayOfMonth}`
        );

        const DayPickerDay = createElementWithClasses("div", "DayPicker-Day");
        if (week === 0 && firstDayOfMonth >= i) {
          DayPickerDay.innerHTML = "";
        } else {
          DayPickerDay.innerHTML = i - firstDayOfMonth;

          DayPickerDay.addEventListener("click", function () {
            const previousSelectedDate = document.getElementById(
              "selectedDate"
            );
            if (previousSelectedDate !== null) {
              previousSelectedDate.classList.remove("DayPicker-Day--selected");
              previousSelectedDate.removeAttribute("id");
            }

            DayPickerDay.classList.add("DayPicker-Day--selected");
            DayPickerDay.id = "selectedDate";

            let index = GOL_Global.HTMLSearchForm.flights.indexOf(flightObj);
            GOL_Global.HTMLSearchForm.flights.fill(
              (flightObj[`${type}_date`] = dayDate),
              index,
              index++
            );
            updateDates(calendarId);
            const calendar = document.getElementById("calendar");
            calendar.remove();
          });
          DayPickerDay.addEventListener("mouseenter", function () {
            DayPickerDay.style.backgroundColor = "#e3edf4";
            DayPickerDay.style.borderRadius = "50%";
          });
          DayPickerDay.addEventListener("mouseleave", function () {
            DayPickerDay.style.backgroundColor = "white";
          });
          const isSameDay =
            selectedDate !== undefined
              ? selectedDate.getFullYear() === date.getFullYear() &&
                selectedDate.getMonth() === date.getMonth() &&
                selectedDate.getDate() === i - firstDayOfMonth
              : false;
          if (isSameDay) {
            DayPickerDay.classList.add("DayPicker-Day--selected");
            DayPickerDay.id = "selectedDate";
          } else if (dayDate.getTime() <= new Date().getTime()) {
            DayPickerDay.classList.add("DayPicker-Day--disabled");
          }

          // Disables return date if it is before departure date
          if (
            calendarId.includes("return_date") ||
            (GOL_Global.HTMLSearchForm?.typeSearch === "MULTIPLE" &&
              calendarId.includes("departure_date") &&
              !calendarId.includes("departure_date_0"))
          ) {
            // Get flight stream index from calendarId
            const calendarIdRegex = /(\d+)/;

            const flightStream = calendarId.match(calendarIdRegex)?.[0] || "0";
            const flightStreamValue =
              flightStream !== "0" ? parseInt(flightStream) : 0;

            const flightIndex = GOL_Global.HTMLSearchForm?.flights.findIndex(
              (flight) => flight.key === flightStreamValue
            );

            // case for return flights not to do -1
            const modifiedFlightIndex =
              flightIndex > 0 ? flightIndex - 1 : flightIndex;

            if (
              dayDate.getDate() <
                GOL_Global.HTMLSearchForm?.flights[
                  modifiedFlightIndex
                ]?.departure_date.getDate() &&
              selectedDate.getMonth() === date.getMonth()
            ) {
              DayPickerDay.classList.add("DayPicker-Day--disabled");
            }
          }
        }

        DayPickerWeek.appendChild(DayPickerDay);
      }
      DayPickerBody.appendChild(DayPickerWeek);
    }
    DayPickerWeekdaysRow.appendChild(DayPickerWeekday);
    DayPickerWeekdays.appendChild(DayPickerWeekdaysRow);
    DayPickerMonth.appendChild(DayPickerCaption);
    DayPickerMonth.appendChild(DayPickerWeekdays);
    DayPickerMonth.appendChild(DayPickerBody);
    return DayPickerMonth;
  }

  function onOnewayTabClick() {
    document
      .getElementById("header-search-form-tab_ONE_WAY")
      .addEventListener("click", function () {
        GOL_Global.HTMLSearchForm.typeSearch = "ONEWAY";

        document.getElementById("searchForm-multiCity").classList.add("hidden");
        document
          .getElementById("searchForm-standard")
          .classList.remove("hidden");

        hideVariableDays(false);
        document
          .getElementById("header-search-form-tab_ONE_WAY")
          .classList.add("header-search-form-tab--active");

        document
          .getElementById("header-search-form-tab_RETURN")
          .classList.remove("header-search-form-tab--active");
        document
          .getElementById("header-search-form-tab_MULTIPLE")
          .classList.remove("header-search-form-tab--active");

        document
          .getElementById("return_date-container")
          .classList.add("hidden");

        document
          .getElementById("header-search-form-multiCity-redirect-container")
          .classList.add("hidden");
        updateProperties("#searchForm-standard");
      });
  }

  function onReturnTabClick() {
    document
      .getElementById("header-search-form-tab_RETURN")
      .addEventListener("click", function () {
        GOL_Global.HTMLSearchForm.typeSearch = "RETURN";

        document.getElementById("searchForm-multiCity").classList.add("hidden");
        document
          .getElementById("searchForm-standard")
          .classList.remove("hidden");
        document
          .getElementById("return_date-container")
          .classList.remove("hidden");
        hideVariableDays(false);
        document
          .getElementById("header-search-form-multiCity-redirect-container")
          .classList.remove("hidden");
        document
          .getElementById("header-search-form-tab_RETURN")
          .classList.add("header-search-form-tab--active");
        document
          .getElementById("header-search-form-tab_ONE_WAY")
          .classList.remove("header-search-form-tab--active");
        document
          .getElementById("header-search-form-tab_MULTIPLE")
          .classList.remove("header-search-form-tab--active");
        updateProperties("#searchForm-standard");
      });
  }

  function onMultiTabClick() {
    toggleProperties("#searchForm-multiCity");
    onToggleProperties("#searchForm-multiCity");
    onPropertiesDoneButton("#searchForm-multiCity");
    ["ADT", "INF", "CHD", "YCD", "YTH"].forEach((type) => {
      onPropertiesRemoveBtn(type, "#searchForm-multiCity");
      onPropertiesAddBtn(type, "#searchForm-multiCity");
    });
    document
      .getElementById("header-search-form-tab_MULTIPLE")
      .addEventListener("click", function () {
        GOL_Global.HTMLSearchForm.typeSearch = "MULTIPLE";
        updateProperties("#searchForm-multiCity");
        multiCityRedirect();
      });
  }

  function onDifferentReturnAirportClick() {
    document
      .getElementById("header-search-form-multiCity-redirect")
      .addEventListener("click", () => {
        GOL_Global.HTMLSearchForm.typeSearch = "MULTIPLE";
        updateProperties("#searchForm-multiCity");
        multiCityRedirect();
      });
  }

  function initProperties() {
    document.getElementsByClassName(
      "header-search-form-properties-class-select"
    )[0].style.textAlign = "left";
  }

  function hideVariableDays(hide) {
    const variableDays = document.getElementById("GOL_package-variableDays");
    const variableDaysMobile = document.getElementById(
      "GOL_package-variableDays-mobile"
    );
    if (variableDays) {
      const action = hide ? "add" : "remove";
      variableDays.classList[`${action}`]("hidden");
      variableDaysMobile.classList[`${action}`]("hidden");
    }
  }

  // Infant and child cannot travel without older person
  // Max 4 passenger types can be selected
  function validateProperties() {
    const passengers = GOL_Global.HTMLSearchForm.properties.passengerCount;

    const adultCount = passengers.YTH + passengers.ADT + passengers.YCD;

    if ((passengers.INF > 0 || passengers.CHD > 0) && adultCount === 0) {
      return { status: false, errorType: "Alert.onlyChild" };
    }

    const allPassengersSelected = Object.values(passengers).find(
      (e) => e === 0
    );

    if (allPassengersSelected === undefined) {
      return { status: false, errorType: "Alert.tooManyPassengerTypes" };
    }
    return { status: true };
  }

  function toggleProperties(formType) {
    const searchFormProperties = document.querySelector(
      `${formType} #header-search-form-properties`
    );

    const propertiesStatus = validateProperties();
    if (!propertiesStatus.status) {
      if (document.getElementById("propertiesError")) {
        return;
      }
      const tableBody = document.querySelector(
        `${formType} #header-search-form-properties > table > tbody`
      );
      const errorDiv = document.createElement("td");
      errorDiv.id = "propertiesError";
      errorDiv.innerHTML = GOL_Global.textStorage[propertiesStatus.errorType];
      errorDiv.style.color = "red";
      errorDiv.style.textAlign = "center";
      errorDiv.style.fontWeight = "bold";
      errorDiv.style.fontSize = "13px";

      const errorRow = document.createElement("tr");

      errorRow.innerHTML = "<td/>";
      errorRow.appendChild(errorDiv);

      tableBody.appendChild(errorRow);
      return;
    }

    const isHidden = searchFormProperties.classList.contains("hidden");
    const action = isHidden ? "remove" : "add";
    searchFormProperties.classList[`${action}`]("hidden");
    const background = document.querySelector(
      `${formType} .loader-wrapper-mini`
    );
    background.classList[`${action}`]("hidden");
    background.onclick = function () {
      toggleProperties(formType);
    };
    document.querySelector(
      `${formType} #header-search-form-properties-arrow`
    ).style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
  }

  function onToggleProperties(formType) {
    const propertiesElements = document.querySelector(
      `${formType} #header-search-form-div_toggle_properties`
    );
    propertiesElements.addEventListener("click", function () {
      toggleProperties(formType);
    });
  }

  function onPropertiesDoneButton(formType) {
    const propertiesDoneBtn = document.querySelector(
      `${formType} #header-search-form-div_toggle_properties_done`
    );
    propertiesDoneBtn.innerHTML =
      GOL_Global.textStorage["PropertiesSelect.done"];
    propertiesDoneBtn.addEventListener("click", function () {
      toggleProperties(formType);
    });
  }

  function multiCityRedirect() {
    document.getElementById("searchForm-multiCity").classList.remove("hidden");
    document.getElementById("searchForm-standard").classList.add("hidden");

    hideVariableDays(true);

    document
      .getElementById("header-search-form-tab_MULTIPLE")
      .classList.add("header-search-form-tab--active");
    document
      .getElementById("header-search-form-tab_RETURN")
      .classList.remove("header-search-form-tab--active");
    document
      .getElementById("header-search-form-tab_ONE_WAY")
      .classList.remove("header-search-form-tab--active");
  }

  function countProperties() {
    return ["ADT", "INF", "CHD", "YCD", "YTH"].reduce((acc, currentValue) => {
      return Number(
        GOL_Global.HTMLSearchForm.properties.passengerCount[`${currentValue}`] +
          acc
      );
    }, 0);
  }

  function switchButtonState(isDisabled) {
    const doneButton = document.querySelector(
      "#header-search-form-div_toggle_properties_done"
    );
    if (isDisabled) {
      doneButton.style.pointerEvents = "none";
    } else {
      doneButton.style.pointerEvents = "auto";
    }
  }

  function checkMoreInfantsThanAdults() {
    if (
      GOL_Global.HTMLSearchForm.properties.passengerCount.INF >
      GOL_Global.HTMLSearchForm.properties.passengerCount.ADT
    ) {
      if (document.querySelector("#propertiesError_1")) {
        return;
      }

      const table = document.querySelector(
        ".header-search-form-properties-table"
      );

      const button = table.querySelector(
        "#header-search-form-div_toggle_properties_done"
      );
      const buttonTd = button.closest("td");
      const previousTd = buttonTd.previousElementSibling;

      if (previousTd) {
        const span = document.createElement("span");
        span.textContent =
          GOL_Global.textStorage["Alert.moreInfantsThanAdults"];
        span.id = "propertiesError_1";
        span.style.textAlign = "left";
        span.style.fontWeight = "bold";
        span.style.fontSize = "13px";
        span.style.color = "red";
        previousTd.appendChild(span);

        switchButtonState(true);
      }
    }
  }

  function checkMaximumPassengers(formType) {
    if (countProperties() === 9) {
      if (document.querySelector("#propertiesError")) {
        return;
      }

      const seniorRow = document
        .querySelector(`${formType} #properties_counter_YCD_value`)
        .closest("tr");
      const errorRow = document.createElement("tr");
      errorRow.className = "#propertiesError";
      errorRow.id = "propertiesError";
      errorRow.innerHTML = `<td colspan="2" style="color: red; text-align: left;">${GOL_Global.textStorage["PropertiesSelect.maxPassengersError"]}</td>`;
      seniorRow.parentNode.insertBefore(errorRow, seniorRow.nextSibling);

      switchButtonState(true);
    }
  }

  function removePropertiesError() {
    const propertiesError = document.getElementById("propertiesError");
    const propertiesError_1 = document.getElementById("propertiesError_1");

    if (propertiesError) {
      propertiesError.remove();
    }

    if (propertiesError_1) {
      propertiesError_1.remove();
    }
    switchButtonState(false);
  }

  function onPropertiesAddBtn(type, formType) {
    const btnEl = document.querySelector(
      `${formType} #properties_counter_${type}_plus`
    );

    btnEl.addEventListener("click", function () {
      removePropertiesError();
      const valueEl = document.querySelector(
        `${formType} #properties_counter_${type}_value`
      );
      const value =
        GOL_Global.HTMLSearchForm.properties.passengerCount[`${type}`];

      if (value < 9 && countProperties() < 9) {
        valueEl.innerHTML = GOL_Global.HTMLSearchForm.properties.passengerCount[
          `${type}`
        ] = value + 1;

        updateProperties(formType);
      }

      checkMoreInfantsThanAdults();
      checkMaximumPassengers(formType);
    });
  }

  function onPropertiesRemoveBtn(type, formType) {
    document
      .querySelector(`${formType} #properties_counter_${type}_minus`)
      .addEventListener("click", function () {
        removePropertiesError();
        const valueEl = document.querySelector(
          `${formType} #properties_counter_${type}_value`
        );
        const value =
          GOL_Global.HTMLSearchForm.properties.passengerCount[`${type}`];
        if (value > 0 && countProperties() > 1) {
          valueEl.innerHTML = GOL_Global.HTMLSearchForm.properties.passengerCount[
            `${type}`
          ] = value - 1;
          updateProperties(formType);
        }

        checkMoreInfantsThanAdults();
      });
  }

  function onToggleClass(formType) {
    document
      .querySelector(`${formType} #search-properties`)
      .addEventListener("click", function (e) {
        e.stopPropagation();
        const menuContainer = document.createElement("ul");
        menuContainer.style.position = "absolute";
        menuContainer.style.background = "white";
        menuContainer.style.boxShadow = "0 0 13px 0 rgba(158, 160, 172, 0.1)";
        menuContainer.style.padding = 0;
        menuContainer.style.margin = 0;
        menuContainer.style.listStyleType = "none";

        const data = {
          ECO: GOL_Global.textStorage["SearchForm.classEconomy"],
          PRE: GOL_Global.textStorage["SearchForm.classPremiumEconomy"],
          BUS: GOL_Global.textStorage["SearchForm.classBusiness"],
          "1ST": GOL_Global.textStorage["SearchForm.classFirstClass"],
        };

        for (const key in data) {
          const row = document.createElement("li");
          row.addEventListener("mouseenter", function () {
            row.style.backgroundColor = "#e3edf3";
          });
          row.addEventListener("mouseleave", function () {
            row.style.backgroundColor = "white";
          });
          row.addEventListener("click", function () {
            GOL_Global.HTMLSearchForm.properties.class = {
              key,
              label: data[key],
            };
            updateProperties(formType);

            menuContainer.remove();
          });
          row.style.height = "24px";
          row.style.padding = "5px 12px";
          row.style.cursor = "pointer";
          row.style.font = "13px Muli, normal";
          row.style.color = "black";
          row.style.whiteSpace = "nowrap";
          row.style.display = "flex";
          row.style.justifyContent = "center";
          row.style.alignContent = "center";
          row.style.flexDirection = "column";
          row.innerHTML = `<p>${data[key].toUpperCase()}</p>`;
          menuContainer.appendChild(row);
        }
        document
          .querySelector(
            `${formType} .header-search-form-properties-class-select`
          )
          .appendChild(menuContainer);
        hideOnClickOutside(menuContainer);
      });
  }

  function onToggleDirectFlights(id) {
    document.getElementById(id).addEventListener("click", function () {
      const el = document.getElementById("header-search-form-only-direct");
      const elMobile = document.getElementById(
        "header-search-form-only-direct-mobile"
      );

      const imgEl = el.children.item(0);
      const uncheckedPath = "static/images/ico-checkbox-unchecked.svg";
      const checkedPath = "static/images/ico-checkbox-checked.svg";

      const imgElMobile = elMobile.children.item(0);

      if (imgEl.getAttribute("src") === uncheckedPath) {
        imgEl.setAttribute("src", checkedPath);
        imgElMobile.setAttribute("src", checkedPath);
        GOL_Global.HTMLSearchForm.max_transfers = "direct";
      } else {
        imgEl.setAttribute("src", uncheckedPath);
        imgElMobile.setAttribute("src", uncheckedPath);
        GOL_Global.HTMLSearchForm.max_transfers = false;
      }
    });
  }

  /* airport select control */
  function createAirportSelectControl(containerDivId) {
    const airportSelectWrapper = document.getElementById(containerDivId);

    const key = getKeyFromID(containerDivId);
    const type = containerDivId.includes("from") ? "from" : "to";
    const idAffix = containerDivId.match(/\d+$/) ? `${type}-${key}` : type;

    const airportSelectInputWrapper = document.createElement("div");
    airportSelectInputWrapper.id = `airportSelectWrapper-${key}`;

    airportSelectInputWrapper.style.display = "none";
    airportSelectInputWrapper.innerHTML = `<input type='text' value='' autocomplete='off' class='buckinput' name='items[]' style='padding:5px; width: 80%; position: relative; top: -2px; outline: none; border: none; font-size: 13pt' id='airportSelectInput-${idAffix}' />`;

    airportSelectWrapper.addEventListener(
      "click",
      function (e) {
        e.stopPropagation();
        const errorDiv = document.getElementById("searchForm-error");
        errorDiv && errorDiv.remove();

        const airportSelectWrapperClicked = getAirportSelectWrapperClicked(e);
        const airportSelectWrapperClickedContent = airportSelectWrapperClicked.querySelectorAll(
          ":scope > div"
        );
        const airportSelectWrapperClickedContentInput = airportSelectWrapperClicked
          .querySelectorAll(":scope > div")[1]
          .querySelector("input");

        airportSelectWrapperClickedContent[0].style.display = "none";
        airportSelectWrapperClickedContent[1].style.display = "block";

        GOL_Global.HTMLSearchForm.editingAirportSelect = airportSelectWrapperClicked.id
          .match(/((from|to)|-\d)/g)
          .join("");
        hideFoundAirportsWrapper();

        airportSelectWrapperClickedContentInput.value = "";

        airportSelectWrapperClickedContentInput.style.display = "block";

        setTimeout(function () {
          airportSelectWrapperClickedContentInput.focus();
        }, 10);

        airportSelectWrapperClickedContentInput.onblur = function () {
          setTimeout(function () {
            airportSelectWrapperClickedContentInput.style.display = "none";
            airportSelectWrapperClickedContent[0].style.display = "block";
            airportSelectWrapperClickedContent[1].style.display = "none";
          }, 100);
        };
        if (["from-0", "from"].includes(idAffix)) {
          defaultAirports();
        }
        const foundAirportsWrapper = document.getElementById(
          "found-airports-wrapper"
        );
        hideOnClickOutside(foundAirportsWrapper);
      },
      false
    );
    airportSelectWrapper.style.height = "28px";
    airportSelectWrapper.style.cursor = "pointer";

    airportSelectWrapper.appendChild(airportSelectInputWrapper);

    document
      .getElementById(`airportSelectInput-${idAffix}`)
      .addEventListener("input", function (e) {
        fetchAirports({ e });
      });

    document
      .getElementById(`airportSelectInput-${idAffix}`)
      .addEventListener("keydown", function (event) {
        const { key } = event; // "ArrowRight", "ArrowLeft", "ArrowUp", or "ArrowDown"

        if (!["ArrowDown", "ArrowUp", "Enter"].includes(key)) {
          return;
        }

        const allListedAirports = document.querySelectorAll(
          ".header-search-form-option"
        );

        if (!allListedAirports || allListedAirports.length === 0) {
          return;
        }

        let currentlySelectedAirportIndex = -1;
        allListedAirports.forEach((airport, index) => {
          if (airport.className.includes("-selected")) {
            currentlySelectedAirportIndex = index;
          }
        });

        if (
          key === "ArrowDown" &&
          allListedAirports[currentlySelectedAirportIndex + 1]
        ) {
          allListedAirports[currentlySelectedAirportIndex + 1].className =
            "header-search-form-option header-search-form-option-selected";
          allListedAirports[currentlySelectedAirportIndex + 1].focus();
          if (allListedAirports[currentlySelectedAirportIndex]) {
            allListedAirports[currentlySelectedAirportIndex].className =
              "header-search-form-option";
          }
        } else if (
          key === "ArrowUp" &&
          allListedAirports[currentlySelectedAirportIndex - 1]
        ) {
          allListedAirports[currentlySelectedAirportIndex - 1].className =
            "header-search-form-option header-search-form-option-selected";
          allListedAirports[currentlySelectedAirportIndex + 1].focus();
          allListedAirports[currentlySelectedAirportIndex].className =
            "header-search-form-option";
        } else if (
          key === "Enter" &&
          document.querySelector(".header-search-form-option-selected")
        ) {
          document.querySelector(".header-search-form-option-selected").click();
        }
        document
          .querySelector(".header-search-form-option-selected")
          .scrollIntoView();
      });
  }

  function defaultAirports() {
    // defaultAirports
    const foundAirports = GOL_Global.config.defaultAirports.map((airport) => {
      const foundCountry = GOL_Global.config.countries.find(
        (country) => country.Code === airport.Country
      );
      if (!foundCountry) {
        const splitCode = airport.Code.split("/");
        const foundLastCountry = GOL_Global.config.defaultAirports.find(
          (e) => e.Code === splitCode[1]
        );
        const foundCountry = GOL_Global.config.countries.find(
          (country) => country.Code === foundLastCountry.Country
        );
        return {
          ...airport,
          Country: foundCountry.$t,
        };
      }
      return {
        ...airport,
        Country: foundCountry.$t,
      };
    });
    printFoundAirports({
      foundAirports,
    });
  }

  function getAirportSelectWrapperClicked(e) {
    const clickedElement = e.target;

    if (isAirportSelectWrapper(clickedElement)) {
      return clickedElement;
    }

    if (isAirportSelectWrapper(clickedElement.parentNode)) {
      return clickedElement.parentNode;
    }
    if (isAirportSelectWrapper(clickedElement.parentNode.parentNode)) {
      return clickedElement.parentNode.parentNode;
    }
    if (isAirportSelectWrapper(clickedElement.parentNode.parentNode)) {
      return clickedElement.parentNode.parentNode;
    }
    if (
      isAirportSelectWrapper(clickedElement.parentNode.parentNode.parentNode)
    ) {
      return clickedElement.parentNode.parentNode.parentNode;
    }
    if (
      isAirportSelectWrapper(
        clickedElement.parentNode.parentNode.parentNode.parentNode
      )
    ) {
      return clickedElement.parentNode.parentNode.parentNode.parentNode;
    }
    if (
      isAirportSelectWrapper(
        clickedElement.parentNode.parentNode.parentNode.parentNode
      )
    ) {
      return clickedElement.parentNode.parentNode.parentNode.parentNode;
    }
  }

  function isAirportSelectWrapper(element) {
    return element.className.indexOf("react-select-2-wrapper-2") !== -1;
  }

  function fetchAirports({ e }) {
    const { value } = e.target;
    if (value.length < 3) {
      return;
    }
    const { config } = GOL_Global;
    const GOLRequest = {
      GolApi: {
        PassiveSessionId: config.passiveSessionId,
        Authorization: {
          Requestor: {
            ClientId: config.requestorClientId,
            Password: config.requestorPassword,
          },
        },
        Settings: {
          Localization: {
            Language: config.lang,
            Country: config.defaultCountry,
          },
        },
        RequestDetail: {
          SearchDestinationsRequest_1: {
            SearchPattern: { $t: value, SearchType: "flight" },
          },
        },
      },
    };

    post({
      url: config.apiUrl,
      data: GOLRequest,
      callback(result) {
        const resultJSON = JSON.parse(result);

        const resultRewritten = mapSearchResultsForAutosuggestion(
          resultJSON.GolApi
        );
        GOL_Global.foundAirports = resultRewritten;
        printFoundAirports({
          foundAirports: resultRewritten,
        });
      },
    });
  }

  function getCountries() {
    const { config } = GOL_Global;
    const GOLRequest = {
      GolApi: {
        PassiveSessionId: config.passiveSessionId,
        Authorization: {
          Requestor: {
            ClientId: config.requestorClientId,
            Password: config.requestorPassword,
          },
        },
        Settings: {
          Localization: {
            Language: config.lang,
            Country: config.defaultCountry,
          },
        },
        RequestDetail: {
          ExportCountryRequest_1: {},
        },
      },
    };

    post({
      url: GOL_Global.config.apiUrl,
      data: GOLRequest,
      callback(result) {
        const resultJSON = JSON.parse(result);
        if (
          resultJSON.GolApi.ResponseDetail.ExportCountryResponse_1 === undefined
        ) {
          return false;
        }

        GOL_Global.config.countries =
          resultJSON.GolApi.ResponseDetail.ExportCountryResponse_1.Country;
      },
    });
  }

  function mapSearchResultsForAutosuggestion(searchDestinationResponse) {
    const airportSuggestions =
      searchDestinationResponse.ResponseDetail.SearchDestinationsResponse_1
        .SearchedAirports.SearchedAirport;

    const parsedSuggestions = airportSuggestions.map((oSearchedAirport) => {
      const oAirportCodeBook = searchDestinationResponse.CodeBook.Airports.Airport.find(
        (oAirport) => oAirport.Code === oSearchedAirport.Destination
      );

      return {
        Code: oSearchedAirport.Destination,
        Parent: oSearchedAirport.Parent,
        Country: oAirportCodeBook.Country,
        State: oAirportCodeBook.State,
        Showcode: oSearchedAirport.ShowCode === "true",
        $t: oAirportCodeBook.$t,
        Category: oAirportCodeBook.Category,
      };
    });

    const { countries } = GOL_Global.config;
    return parsedSuggestions.map((suggestion) => {
      const foundCountry = countries.find(
        (country) => country.Code === suggestion.Country
      );

      return { ...suggestion, Country: foundCountry.$t };
    });
  }

  function categoryIcon(category, hasMoreAirports) {
    const iconWrapperDiv = document.createElement("div");
    iconWrapperDiv.style.display = "inline-block";
    iconWrapperDiv.style.float = "left";
    if (!["AIRPORT", "RAIL", "BUS"].includes(category)) {
      return iconWrapperDiv;
    }
    iconWrapperDiv.style.marginLeft = hasMoreAirports ? "20px" : "0p";
    const categoryIconMapping = {
      AIRPORT: "plane",
      RAIL: "train",
      BUS: "bus",
    };

    const prefixIcon = document.createElement("img");
    prefixIcon.src = `static/images/ico-${
      categoryIconMapping[`${category}`]
    }.svg`;
    prefixIcon.style.width = "14px";
    prefixIcon.style.height = "14px";
    prefixIcon.style.marginRight = "10px";
    prefixIcon.alt = "category icon";
    iconWrapperDiv.appendChild(prefixIcon);
    return iconWrapperDiv;
  }
  function printFoundAirports({ foundAirports }) {
    let foundAirportsWrapper = document.getElementById(
      "found-airports-wrapper"
    );

    if (!foundAirportsWrapper) {
      foundAirportsWrapper = document.createElement("div");
      foundAirportsWrapper.className =
        "header-search-form-results select-menu-outer";
      foundAirportsWrapper.id = "found-airports-wrapper";
      foundAirportsWrapper.innerHTML = "found-airports-wrapper";
      foundAirportsWrapper.style.backgroundColor = "white";
      const parentEl = document.getElementById(
        `airport-select-${GOL_Global.HTMLSearchForm.editingAirportSelect}`
      ).parentElement;
      parentEl.appendChild(foundAirportsWrapper);
      hideOnClickOutside(foundAirportsWrapper);
    }
    foundAirportsWrapper.style.maxHeight = "200px";
    foundAirportsWrapper.style.overflow = "auto";
    foundAirportsWrapper.style.display = "block";
    foundAirportsWrapper.style.position = "absolute";
    foundAirportsWrapper.style.maxWidth = "400px";

    foundAirportsWrapper.innerHTML = "";

    for (let i = 0; i < foundAirports.length; i++) {
      const hasMoreAirports = foundAirports[Number(i)]?.Parent?.length;
      const optionCategory = foundAirports[Number(i)]?.Category;

      const foundAirportDiv = document.createElement("div");
      foundAirportDiv.className = `header-search-form-option ${
        GOL_Global.innerWidth < THRESHOLD_WIDTH_DESKTOP_PX
          ? "header-search-form-option-mobile"
          : ""
      }`;
      foundAirportDiv.setAttribute(
        "data-airport-code",
        foundAirports[Number(i)].Code
      );
      foundAirportDiv.setAttribute(
        "data-airport-title",
        foundAirports[Number(i)].$t
      );
      // const foundAirportContentDiv = document.createElement("div");
      foundAirportDiv.style.display = "flex";
      foundAirportDiv.style.justifyContent = "flex-start";

      const airportItemDiv = document.createElement("div");
      airportItemDiv.innerHTML = `${foundAirports[i].$t}, ${
        foundAirports[Number(i)].Country
      }${
        foundAirports[Number(i)].Showcode
          ? ` <b>(${foundAirports[Number(i)].Code})</b>`
          : ""
      }`;

      const docFrag = document.createDocumentFragment();
      docFrag.appendChild(categoryIcon(optionCategory, hasMoreAirports));
      docFrag.appendChild(airportItemDiv);
      foundAirportDiv.setAttribute(
        "data-showcode",
        foundAirports[Number(i)].Showcode
      );
      foundAirportDiv.appendChild(docFrag);

      foundAirportDiv.onclick = async function (e) {
        const selectedAirportData = await getSelectedAirportData(e);
        let flightIndex = parseInt(
          GOL_Global.HTMLSearchForm.editingAirportSelect.match(/\d/g)?.join(""),
          10
        );
        flightIndex = isNaN(flightIndex) ? 0 : flightIndex;
        const flightType = GOL_Global.HTMLSearchForm.editingAirportSelect.includes(
          "from"
        )
          ? "from"
          : "to";

        const flight = GOL_Global.HTMLSearchForm.flights.find(
          (flight) => flight.key === flightIndex
        ) ?? {
          key: GOL_Global.HTMLSearchForm.flights.length,
          from: "",
          to: "",
        };
        let index = GOL_Global.HTMLSearchForm.flights.indexOf(flight);
        GOL_Global.HTMLSearchForm.flights.fill(
          (flight[flightType] = selectedAirportData.airportCode),
          index,
          index++
        );

        GOL_Global.HTMLSearchForm[
          GOL_Global.HTMLSearchForm.editingAirportSelect
        ] = selectedAirportData.airportCode;
        printSelectedAirport(selectedAirportData);
        hideFoundAirportsWrapper();
      };
      foundAirportsWrapper.appendChild(foundAirportDiv);
    }
  }

  async function getSelectedAirportData(e) {
    if (e.target.dataset.airportCode) {
      return e.target.dataset;
    }

    if (e.target.parentNode.dataset.airportCode) {
      return e.target.parentNode.dataset;
    }

    const { foundAirports } = GOL_Global;
    const airportCodeFromInnerText = e.target.innerText
      .replace(/[()]/g, "")
      .trim();
    foundAirports.forEach((airport) => airport.$t === airportCodeFromInnerText);
    const airport = foundAirports.find(
      (airport) => airport.Code === airportCodeFromInnerText
    );

    return {
      airportCode: airport.Code,
      Showcode: airport.Showcode,
      airportTitle: airport.$t,
    };
  }

  function hideFoundAirportsWrapper() {
    const foundAirportsWrapper = document.getElementById(
      "found-airports-wrapper"
    );
    if (foundAirportsWrapper) {
      foundAirportsWrapper.remove();
    }
  }

  function printSelectedAirport(selectedAirportData, synced = true) {
    const text = `#airport-select-${GOL_Global.HTMLSearchForm.editingAirportSelect} > div > div`;

    const elementToPrintSelectedAirportTo = document.body.querySelectorAll(
      text
    )[0];

    elementToPrintSelectedAirportTo.innerHTML = `<span role="button" id="from-value"><span class="header-search-form-inner-field-value">${formatCityLabel(
      selectedAirportData.airportTitle
    )}</span>${
      selectedAirportData.showcode === "true" ||
      selectedAirportData.Showcode === true
        ? `<span class="header-search-form-inner-field-additional"> (${selectedAirportData.airportCode})</span>`
        : ""
    }</span>`;
    toggleAirportSelectContent();
    const { editingAirportSelect } = GOL_Global.HTMLSearchForm;
    if (editingAirportSelect === "from" && synced) {
      GOL_Global.HTMLSearchForm.editingAirportSelect = "from-0";
      printSelectedAirport(selectedAirportData, false);
    } else if (editingAirportSelect === "from-0" && synced) {
      GOL_Global.HTMLSearchForm.editingAirportSelect = "from";
      printSelectedAirport(selectedAirportData, false);
    } else if (editingAirportSelect === "to" && synced) {
      GOL_Global.HTMLSearchForm.editingAirportSelect = "to-0";
      printSelectedAirport(selectedAirportData, false);
    } else if (editingAirportSelect === "to-0" && synced) {
      GOL_Global.HTMLSearchForm.editingAirportSelect = "to";
      printSelectedAirport(selectedAirportData, false);
    }
  }

  formatCityLabel = (label) => {
    if (!label) {
      return "";
    }

    let newLabel = "";

    const cities = label.split("/");
    cities.forEach((city, index) => {
      const cityName = city.split("-");
      if (cities.length > 0 && index !== cities.length - 1) {
        newLabel += `${cityName[0]}/`;
      } else if (cities.length > 0 && index === cities.length - 1) {
        newLabel += cityName[0];
      } else {
        newLabel = label;
      }
    });

    return newLabel;
  };

  function toggleAirportSelectContent() {
    const airportSelectContents = document.body.querySelectorAll(
      `#airport-select-${GOL_Global.HTMLSearchForm.editingAirportSelect} > div`
    );
    airportSelectContents[0].style.display = "block";
    airportSelectContents[1].style.display = "none";
  }

  function validateOnSubmit() {
    const {
      HTMLSearchForm: { typeSearch, flights },
    } = GOL_Global;

    let isValid = true;

    if (typeSearch === "MULTIPLE") {
      flights.forEach((flight) => {
        if (!flight.from) {
          const errorDiv = createErrorMessageElement(`-from-${flight.key}`);
          const el = document.getElementById(
            `airport-select-from-${flight.key}`
          );
          el.parentElement.appendChild(errorDiv);
          isValid = false;
        }
        if (!flight.to) {
          const errorDiv = createErrorMessageElement(`-to-${flight.key}`);
          const el = document.getElementById(`airport-select-to-${flight.key}`);

          el.parentElement.appendChild(errorDiv);

          isValid = false;
        }
      });
    } else {
      if (!flights[0].from) {
        const errorDiv = createErrorMessageElement("-from");
        const el = document.getElementById("airport-select-from");
        el.parentElement.appendChild(errorDiv);
        isValid = false;
      }
      if (!flights[0].to) {
        const errorDiv = createErrorMessageElement("-to");
        const el = document.getElementById("airport-select-to");
        el.parentElement.appendChild(errorDiv);

        isValid = false;
      }
    }

    return isValid;
  }

  function createErrorMessageElement(affix) {
    const errorDiv = createElementWithClasses("div", "search-field-error");
    errorDiv.innerHTML = GOL_Global.textStorage["SearchForm.fillInPlaces"];
    errorDiv.id = `searchForm-error${affix}`;

    return errorDiv;
  }

  function onSubmitMobile() {
    const submitButton = document.getElementById(
      "GOL_package-textStorage-SearchForm.searchFlights-mobile"
    );
    submitButton.onclick = function () {
      onSubmit();
    };
  }

  function onSubmitDesktop() {
    const submitButton = document.getElementById(
      "GOL_package-textStorage-SearchForm.searchFlights"
    );
    submitButton.onclick = function () {
      onSubmit();
    };
  }

  function onSubmit() {
    const { HTMLSearchForm, config } = GOL_Global;
    if (!validateOnSubmit()) {
      return;
    }

    function formatPassengersForQuery() {
      const passengers = HTMLSearchForm.properties.passengerCount;

      if (!passengers) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(passengers).filter(([key, value]) => value > 0)
      );
    }

    const query = {
      from: HTMLSearchForm.flights[0].from,
      to: HTMLSearchForm.flights[0].to,
      departureDate: getBasicDate(HTMLSearchForm.flights[0].departure_date),
      returnDate: getBasicDate(HTMLSearchForm.flights[0].return_date),
      flightClass: HTMLSearchForm.properties.class.key,
      ...formatPassengersForQuery(),
      ...(HTMLSearchForm.max_transfers && { max_transfers: "direct" }),
      ...(HTMLSearchForm.preferred_airline && {
        preferred_airline: HTMLSearchForm.preferred_airline,
      }),
      ...(HTMLSearchForm.toleranceDays && {
        toleranceDays: HTMLSearchForm.toleranceDays,
      }),
      date: Date.now(),
      lang: config.lang,
    };

    if (HTMLSearchForm.typeSearch === "ONEWAY") {
      delete query.returnDate;
    }

    if (HTMLSearchForm.typeSearch === "MULTIPLE") {
      delete query.from;
      delete query.to;
      delete query.departureDate;
      delete query.returnDate;
      delete query.toleranceDays;
      HTMLSearchForm.flights.forEach((flight, i) => {
        query[`flight_${i + 1}_origin`] = flight.from;
        query[`flight_${i + 1}_destination`] = flight.to;
        query[`flight_${i + 1}_departureDate`] = getBasicDate(
          flight.departure_date
        );
      });
    }
    window.location.href = `${config.feUrl}/results?${encodeQueryData(query)}`;
  }

  function encodeQueryData(data) {
    const ret = [];
    for (const d in data)
      ret.push(`${encodeURIComponent(d)}=${encodeURIComponent(data[`${d}`])}`);
    return ret.join("&");
  }

  function post({ url, data, callback }) {
    httpRequest = new XMLHttpRequest();
    httpRequest.open("POST", url);
    httpRequest.send(JSON.stringify(data));
    httpRequest.onreadystatechange = function () {
      // Process the server response here.
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
          callback(httpRequest.responseText);
        } else {
          alert("There was a problem with the request.");
        }
      }
    };
  }

  function removeElement(id) {
    const elem = document.getElementById(id);
    if (!elem) {
      return;
    }
    return elem.parentNode.removeChild(elem);
  }

  function getBasicDate(d = null) {
    const date = new Date(d);
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
      date.getDate()
    )}`;
  }

  function pad2(num) {
    return (num * 1 < 10 ? "0" : "") + num * 1;
  }

  function getPageWidth() {
    return Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    );
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  window.GOL_Global = window.GOL_Global || {};
  window.GOL_Global.config = window.GOL_Global.config || {};
  window.GOL_Global.textStorage = window.GOL_Global.textStorage || {};
  window.GOL_Global.ForAll = window.GOL_Global.ForAll || {};
})();
