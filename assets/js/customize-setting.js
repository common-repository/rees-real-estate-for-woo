jQuery( document ).ready( function ( $ ) {
    'use strict';

    let submenu = [
        'input_search',
        'button_search',
        'price_search',
        'size_search',
    ];

    let buttonTrigger = "customize-control-woorealestate_params-button_search_type select";
    let buttonData = {
        text: 'button_search_text,button_search_text_size',
        icon: 'button_search_icon,button_search_icon_size',
        icon_text: 'button_search_text,button_search_text_size,button_search_icon,button_search_icon_size'
    }

    function loadListen(trigger, data) {
        if (!trigger || !data) {
            return;
        }

        trigger = $(`#${trigger}`);

        showHide(trigger.val(), data);

        trigger.on("change", function (e) {
            showHide($(this).val(), data);
        });
    }


    function showHide(targetVal, data) {

        for (const dataKey in data) {
            let dataItems = data[dataKey].split(',');
            if (targetVal !== dataKey) {
                dataItems.forEach(function (value) {
                    $(`li[id*="${value}"]`).css({
                        visibility: 'hidden',
                        height: 0,
                        'margin-bottom': 0
                    });
                });
            }
        }

        data[targetVal].split(',').forEach(function (value) {
            $(`li[id*="${value}"]`).css({
                visibility: 'visible',
                height: 'auto',
                'margin-bottom': 12
            });
        });

    }

    loadListen(buttonTrigger, buttonData);

    $(".customize-section-back").on("click", function () {
        let id = $(this).parent().parent().parent().prop('id').replace("sub-accordion-section-woore_search_customizer_", "");
        if (submenu.indexOf(id) > -1) {
            wp.customize.section("woore_search_customizer_position_fields").expanded(true);
            wp.customize.previewer.send("woores_remove_state_editing", true);
        }
    });

    wp.customize.previewer.bind("woores_handle_overlay_processing", function (message) {
        if (message === "show") {
            $(".woore-real-estate-search-control-processing").show();
        } else {
            $(".woore-real-estate-search-control-processing").hide();
        }
    });

    wp.customize.previewer.bind("woores_shortcut_edit", function (message) {
        if (wp.customize.section("woore_search_customizer_" + message)) {
            wp.customize.section("woore_search_customizer_" + message).expanded(true);
        }
    });

    $("body").on("click", ".woore-real-estate-search-container .dashicons-edit", function (e) {
        e.stopPropagation();
        let parent = $(this).parent();
        let item = parent.data()["block_item"];
        wp.customize.previewer.send("woores_shortcut_edit_item_from_section", 'woore-real-estate-search-edit-item-shortcut[data-edit_section="' + item + '"]');
    });

    wp.customize.panel("woocommerce_real_estate_search", function (panel) {
        panel.expanded.bind(function (isExpanded) {
            if (isExpanded) {
                let url = vicWreCusSettingParam.searchResultUrl;
                if (location.href !== url && location.href.indexOf('woocommerce_real_estate_search') === -1) {
                    location.href = url + '&autofocus[panel]=woocommerce_real_estate_search';
                }
            }
        });
    });


    const prefix = "woore-real-estate-search-";

    ViWre.CustomizeSettings = {
        init() {
            this.container = $( "#customize-controls" );

            this.checkboxControlContainer = $( `.${prefix}toggle-checkbox-container` );
            this.checkboxControlContainer.each( this.checkboxChange );

            this.rangeSliderControl = $( `.${prefix}customize-range` );
            this.rangeSliderControl.each( this.handleRangeSlider );

            this.container.on( "change", "#customize-control-woorealestate_params-fields_size select", this.handleFieldsSize );

            this.load();
        },

        load() {
            const _this = this;

            $(`li[id$="tablet"]`).each( function () {
                $(this).css({visibility: 'hidden', height: 0, 'margin-bottom': 0});
            } );

            $(`li[id$="mobile"]`).each( function () {
                $(this).css({visibility: 'hidden', height: 0, 'margin-bottom': 0});
            } );

            this.showHideDevice('desktop' );

            this.container.find( ".devices-wrapper button" ).each( function () {
                let button = $(this);
                button.on("click", function () {
                    _this.showHideDevice( button.data("device") );
                } );
            } );
        },

        showHideDevice( device ) {
            const devices = ['desktop', 'tablet', 'mobile'];
            $.each( devices, function ( index, value ) {
                if ( device === value ) {
                    $(`li[id$="${value}"]`).each( function () {
                        $(this).css({visibility: 'visible', height: 'auto', 'margin-bottom': 12});
                    } );
                }else {
                    $(`li[id$="${value}"]`).each( function () {
                        $(this).css({visibility: 'hidden', height: 0, 'margin-bottom': 0});
                    } );
                }
            } );
        },

        checkboxChange() {
            const wp_control_id = $( this ).data( "id" ),
                wp_control_choices = $( this ).data( "choices" );

            $( `[name="${prefix}${wp_control_id}"]` ).on( "input", function () {

                let oldValue = wp.customize(wp_control_id).get();

                let newValue = Object.keys(wp_control_choices).find(property => property !== oldValue);

                wp.customize(wp_control_id).set(newValue);

            } );
        },

        handleRangeSlider() {
            let range_wrap = $(this),
                range = $(this).find(`.${prefix}customize-range1`);
            let setting = range_wrap.find( `.${prefix}customize-range-value`).attr('data-customize-setting-link');
            let min = range.attr('min') || 0,
                max = range.attr('max') || 0,
                start = range.data('start');
            range.range({
                min: min,
                max: max,
                start: start,
                input: range_wrap.find(`.${prefix}customize-range-value`),
                onChange: function (val) {
                    if (wp.customize(setting).get().toString() !== val.toString()) {
                        wp.customize(setting, function (e) {
                            e.set(val);
                        });
                    }
                }
            });
            range_wrap.next(`.${prefix}customize-range-min-max`).find(`.${prefix}customize-range-min`).on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                range.range('set value', min);
            });
            range_wrap.next(`.${prefix}customize-range-min-max`).find(`.${prefix}customize-range-max`).on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                range.range('set value', max);
            });
            range_wrap.find(`.${prefix}customize-range-value`).on('change', function () {
                let val = parseInt($(this).val() || 0);
                if (val > parseInt(max)) {
                    val = max
                } else if (val < parseInt(min)) {
                    val = min;
                }
                range.range('set value', val);
            });
        },

        handleFieldsSize(e) {
            let buttonInputVal = {
                    ex_small: '2_8',
                    small: '6_12',
                    medium: '10_16',
                    large: '14_20',
                    ex_large: '18_24',
                },
                newval = $(this).val();

            const inputSelect = $( "#customize-control-woorealestate_params-input_size select" ),
                buttonSelect = $( "#customize-control-woorealestate_params-button_size select" );
            inputSelect.val( buttonInputVal[newval] );
            inputSelect.trigger("change");
            buttonSelect.val( buttonInputVal[newval] );
            buttonSelect.trigger("change");
        },

    };

    ViWre.CustomizeSettings.init();

} );