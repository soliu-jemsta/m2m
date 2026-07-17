var PeoplePicker = new PeoplePickerComponentConstructor();
function PeoplePickerComponentConstructor () {
  this.pickerEventDefinitions = null;
  this.defaultValues = {};
}

PeoplePicker.setDefault = function (pickerId, email) {
  if (!pickerId || !email) return;
  PeoplePicker.defaultValues[pickerId] = email;
};

PeoplePicker.initializePeoplePickers = function (peopleListMap, pickerEvents, attr = "custom-people") {
  PeoplePicker.pickerEventDefinitions = null;
  const pickers = document.querySelectorAll(`[${attr}]`);

  pickers.forEach(picker => {
    const $picker = $(picker);
    // Destroy existing Select2 instance
    if ($picker.data('select2')) {
      $picker.select2('destroy');
    }

    const pickerId = picker.getAttribute(attr);
    let peopleList;
    if (Array.isArray(peopleListMap)) {
      peopleList = peopleListMap;
    } else {
      peopleList = peopleListMap?.[pickerId];
      if (!Array.isArray(peopleList)) return;
    }

    // Remove duplicates based on Email
    const uniquePeopleList = Array.from(new Map(peopleList.map(item => [item.Email, item])).values());

    $picker.empty().append('<option></option>');

    uniquePeopleList.forEach(person => {
      var str = `<option value="${person.Email}" data-image="${MainApplication.profilephoto}${person.Email}">${person.Title}</option>`;
      $picker.append(str);
    });

    const placeholderText = $picker.attr("placeholder") || "Enter a name";
    const modalParent = $picker.closest('.modal');
    var options = {
      placeholder: placeholderText,
      allowClear: !$picker.prop("multiple"),
      minimumInputLength: 3,
      templateResult: formatOption,
      templateSelection: formatOption,
      matcher: function (params, data) {
        if ($.trim(params.term) === '') {
          return data;
        }
        const term = params.term.toLowerCase();
        if (data.text && data.text.toLowerCase().includes(term)) {
          return data;
        }
        if (data.id && data.id.toLowerCase().includes(term)) {
          return data;
        }
        return null;
      },
      ...(modalParent.length && { dropdownParent: modalParent })
    };

    $picker.select2(options);

    if (typeof pickerEvents !== "undefined") {
      PeoplePicker.pickerEventDefinitions = pickerEvents;
      $(picker).on('select2:select', function (e) {
        var selectedValue = e.params.data.id;
        var prop = e.target.getAttribute("custom-people");
        if (typeof PeoplePicker.pickerEventDefinitions[prop] == "function") {
          PeoplePicker.pickerEventDefinitions[prop](selectedValue);
        }

        var selectionOrder = e.target.getAttribute("disable-selection-order");
        selectionOrder = selectionOrder === "true";
        if ($(e.target).prop("multiple") && selectionOrder) {
          var element = e.params.data.element;
          var $element = $(element);
          if (!$(this).find(`option[value="${$element.val()}"]`).length) {
            $element.detach();
            $(this).append($element);
          }
          $(this).trigger('change');
        }
      });
    }

    const defaultVal = PeoplePicker.defaultValues?.[pickerId];
    if (defaultVal) {
      let selectid = picker.getAttribute("id");
      let selectionOrder = picker.getAttribute("disable-selection-order");
      selectionOrder = selectionOrder === "true";
      if ($picker.prop("multiple") && selectionOrder) {
        defaultVal.forEach(function (item) {
          var option = $('select#' + selectid + ' option[value="' + item + '"]');
          option.detach();
          $('select#' + selectid).append(option);
        });
        $picker.val(defaultVal).trigger('change');
      } else {
        $picker.val(defaultVal).trigger("change");
      }
    }

    function formatOption(option) {
      if (!option.id) return option.text;
      var imageUrl = $(option.element).data('image');
      return $(`<span><img src="${imageUrl}" class="custom-picker-li-image"> ${option.text}</span>`);
    }
  });
};

PeoplePicker.getValue = function (customAttr = "custom-people") {
  const pickers = document.querySelectorAll(`[${customAttr}]`);
  let results = {};

  pickers.forEach(picker => {
      const pickerId = picker.getAttribute(customAttr);
      const valueType = picker.getAttribute("control-value-type");
      const $picker = $(picker);
      const selected = $picker.val();


      if ($picker.prop("multiple")) {
          if (!Array.isArray(selected)) return;
          for(var x = 0; x < selected.length; x++){
            if (!selected[x]) continue;
            if (valueType === "people") {
              results[pickerId] = results[pickerId] || [];
              results[pickerId].push(SP.FieldUserValue.fromUser(selected[x]));
            } else {
              results[pickerId] = results[pickerId] || [];
              results[pickerId].push(selected[x]);
            }
          }
      } else {
        results[pickerId] = (valueType === "people") ? SP.FieldUserValue.fromUser(selected) : selected;
      }
  });

  return results;
};

PeoplePicker.getConfiguredValue = function (customAttr = "custom-people") {
  const pickers = document.querySelectorAll(`[${customAttr}]`);
  let results = {};

  pickers.forEach(picker => {
      const pickerId = picker.getAttribute(customAttr);
      const $picker = $(picker);
      const selected = $picker.val();

      if ($picker.prop("multiple")) {
          if (!Array.isArray(selected)) return;

          for(var x = 0; x < selected.length; x++){
            results[pickerId] = results[pickerId] || [];
            results[pickerId].push(selected[x]);
          }
      } else {
        results[pickerId] = selected;
      }
  });

  return results;
};

PeoplePicker.getTitle = function (customAttr = "custom-people") {
  const pickers = document.querySelectorAll(`[${customAttr}]`);
  let results = {};

  pickers.forEach(picker => {
    const pickerId = picker.getAttribute(customAttr);
    const $picker = $(picker);
    const selected = $picker.val();

    if ($picker.prop("multiple")) {
      if (!Array.isArray(selected)) return;

      results[pickerId] = selected.map(val => {
        const option = $picker.find(`option[value="${val}"]`);
        return option.text();
      });
    } else {
      const option = $picker.find(`option[value="${selected}"]`);
      results[pickerId] = option.text();
    }
  });

  return results;
};

// PeoplePicker.disablePicker = function (pickerId) {
//   const $picker = $(`[custom-people="${pickerId}"]`);
//   if (!$picker.length) return;

//   $($picker).prop('disabled', true);
// };

PeoplePicker.disablePicker = function (pickerId) {
  const $picker = $(`[custom-people="${pickerId}"]`);
  if (!$picker.length) return;

  // Disable the underlying select element
  $picker.prop('disabled', true);
  // Notify Select2 to disable the UI
  $picker.select2('enable', false);
};

PeoplePicker.reset = function (pickerId) {
  const $picker = $(`[custom-people="${pickerId}"]`);
  if (!$picker.length) return;

  const isMultiple = $picker.prop("multiple");
  $picker.val(isMultiple ? [] : null).trigger("change");

  $picker.find('option').filter(function () {
    return !this.value; // catches "" or undefined
  }).remove();
};

PeoplePicker.resetAll = function (attr = "custom-people") {
  const pickers = document.querySelectorAll(`[${attr}]`);
  pickers.forEach(picker => {
    const $picker = $(picker);
    const isMultiple = $picker.prop("multiple");
    $picker.val(isMultiple ? [] : null).trigger("change");

    $picker.find('option').filter(function () {
      return !this.value;
    }).remove();
  });
};
