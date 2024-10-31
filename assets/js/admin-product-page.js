if( ViWre === undefined ) {
    var ViWre = {};
}

jQuery( document ).ready( function( $ ) {

    'use strict';

    $( ".options_group.pricing" ).addClass( 'show_if_real-estate' );
    $( ".options_group.pricing.show_if_real-estate" ).show();

    let checkUniqueId = [];

    window.wooreGenerateID = () => {
        let id = `ID_${Date.now()}`;
        if (checkUniqueId.includes(id)) {
            id = wooreGenerateID();
        } else {
            checkUniqueId.push(id);
        }
        return id;
    };

    window.viHuiToast = ({
        title = '',
        message = '',
        type = 'success',
        duration = 3000
    }) => {
        const main = $( "#vi-hui-toast" );
        if ( main.get(0) ) {

            const toast = $( "<div></div>" );

            const autoRemoveToast = setTimeout( function () {
                main.find( ".vi-hui-toast" ).remove();
            }, duration + 1000 );

            toast.on( "click", ".vi-hui-toast-close", function (e) {
                main.find( ".vi-hui-toast" ).remove();
                clearTimeout( autoRemoveToast );
            } );

            if ( main.children().length > 0 ) {
                main.find( ".vi-hui-toast" ).first().remove();
                clearTimeout( autoRemoveToast );
            }

            const icons = {
                success: 'dashicons dashicons-yes-alt',
                error: 'dashicons dashicons-dismiss',
            }
            const icon = icons[type];
            const delay = (duration / 1000).toFixed(2);

            toast.addClass( `vi-hui-toast vi-hui-toast__${type}` );
            toast.css( { "animation": `slideInLeft ease .3s, fadeOut linear 1s ${delay}s forwards` } );
            toast.html(
                `<div class="vi-hui-toast-icon">
                    <span class="${icon}"></span>
                   
                </div>
                <div class="vi-hui-toast-body">
                    <p class="vi-hui-toast-body-header">${title}</p>
                    <span class="vi-hui-toast-body-info">${message}</span>
                </div>
                <div class="vi-hui-toast-close">
                    <span class="dashicons dashicons-no-alt"></span>
                </div>`);

            if ( main.children().length > 0 ) {
                let firstEleTypeClass = main.find( ".vi-hui-toast" ).first().attr( "class" ).split(/\s+/)[1];
                let firstEleType = firstEleTypeClass.replace( "vi-hui-toast__", "" );
                if ( type !== firstEleType ) {
                    main.append( toast );
                }
            }else {
                main.append( toast );
            }

        }
    };

    function showToastChange() {
        viHuiToast({
            title: VicWreParams.i18n.success,
            message: VicWreParams.i18n.saved,
            type: "success",
            duration: 3000,
        });
    }

    let mediaProperties = {
        title : VicWreParams.i18n.choose_image,
        buttonText: VicWreParams.i18n.select,
        multiple: false,
    }

    let viewer = null;

    ViWre.Panellum = {
        init() {
            const container = $( ".woore-tour-container" );
            this.targetViewer = null;
            this.hotspot_selected = null;
            this.ele_selected = null;
            this.scene_selected = null;
            this.isDrop = false;
            this.isPreviewOpen = true;
            this.previewViewer = null;
            this.dataViewer = {
                scenes: {}
            };

            this.countScene = 0;

            container.on( "click", this.click.bind( this ) );

            container.on( "dragstart", ".woore-tour-scene-item", { self: this },  this.dragStart );
            container.on( "dragover",  this.dragOver.bind( this ) );
            container.on( "drop",  this.drop.bind( this ) );
            container.on( "dragend", ".woore-tour-scene-item", { self: this },  this.dragEnd );

            container.on( "click", ".woore-tour-add-scene", { self:this }, this.addScene );
            container.on( "click", "#woore-tour-preview-button", { self: this }, this.handleButtonPreview );
            container.on( "mousedown", ".vi-hui-hotspot", { self:this }, this.hotspotClick );

            container.on( "keyup",  this.keyup.bind( this ) );
            container.on( "mouseup", this.mouseup.bind( this ) );
            container.on( "keydown", this.keydown.bind( this ) );
            container.on( "change", this.change.bind( this ) );

            this.load();
        },

        getTour() {
            const self = this;
            let data = {
                action: 'woore_get_virtual_tour',
                nonce: VicWreParams.nonce,
                post_id: $( 'input[name="post_ID"]' ).val(),
            }
            $.ajax({
                url: VicWreParams.ajaxUrl,
                type: 'post',
                dataType: 'json',
                data: data,
                async: false,
                beforeSend: function (  ) {
                },
                success: function ( res ) {
                    let value = JSON.parse( res );
                    if ( value ) {
                        self.dataViewer = value;
                    }
                },
                error: function ( res ) {
                    if ( res ) {
                        console.log( res.data );
                    }
                },
                complete: function () {
                }
            });
        },

        load() {
            const _this = this;
            _this.getTour();
            let data = _this.dataViewer;
            let sceneActive = "";

            if ( !viewer && Object.keys( data.scenes ).length > 0 ) {
                data.huiStatus = "editor";
                data.default = {
                    "firstScene": data.default.firstScene,
                    "sceneFadeDuration": 1000,
                    "showControls": false,
                    "disableKeyboardCtrl": true,
                    "keyboardZoom": false,
                }

                viewer = pannellum.viewer( "woore-tour-panorama", {
                    huiStatus: "editor",
                    default: data.default,
                    scenes: {},
                });

                for ( const scenesKey in data.scenes ) {
                    if (data.scenes[scenesKey].hy_isActive) {
                        sceneActive = scenesKey;
                    }

                    if ( data.scenes[scenesKey].hotSpots ) {
                        for ( const hotspot of data.scenes[scenesKey].hotSpots ) {
                            hotspot.draggable = true;
                            hotspot.dragHandlerFunc = function (evet, hs) {
                                if ( evet.type === "mouseup" ){
                                    let location = hs.viewer.mouseEventToCoords( evet );
                                    let hotSpots = hs.viewer.getConfig().hotSpots;
                                    let hotSpot = hotSpots.filter(function (hotspot) {
                                        return hotspot.id === hs.id;
                                    });

                                    if ( (location[0] === hotSpot[0].pitch) && (location[1] === hotSpot[0].yaw) ) {
                                        showToastChange();
                                    }
                                }
                            };

                            hotspot.dragHandlerArgs = {viewer :viewer, id: hotspot.id};

                            hotspot.clickHandlerFunc = function ( evet, hs) {
                                _this.renderHotspotSetting( viewer.getConfig().scenes, viewer.hyGetHotspot( hs.id ) );
                                _this.hotspot_selected = viewer.hyGetHotspot( hs.id );
                            };

                            hotspot.clickHandlerArgs = {viewer :viewer, id: hotspot.id};
                        }
                    }

                    viewer.addScene( scenesKey, data.scenes[scenesKey] );
                }

                this.countScene = viewer !== null ? Object.keys( viewer.getConfig().scenes ).length : 0;
                viewer.hySetScene( sceneActive );
                viewer.loadScene( sceneActive, 0, 0, 100 );
            }

            if ( this.checkScene() ) {
                this.loadScenes();
                this.renderSceneSetting( data.scenes[sceneActive], sceneActive );
                this.scene_selected = $( `#${viewer.getScene()}` ).get(0);
                this.addIconSceneDefault( `#${data?.default?.firstScene}` );

                if ( Object.keys( data?.scenes ) ) {
                    let btnTourEditor = $( "#woore-tour-open-editor" );
                    btnTourEditor.addClass( "woore-tour-created" );
                    btnTourEditor. find( "img" ).attr( "src", data.scenes[ data.default.firstScene ].panorama );
                }else {
                    $( "#woore-tour-open-editor" ).removeClass( "woore-tour-created" );
                }
            }
        },

        change(e) {
            if( e.target.id === "woore-target-scene" ) {
                let sceneId = $( "#woore-target-scene" ).val().trim();

                if ( sceneId === "" ) {
                    $( ".woore-tour-field-target-view" ).hide();
                }else {
                    $( ".woore-tour-field-target-view" ).show();
                    this.hotspot_selected = viewer.hyGetHotspot( this.hotspot_selected.id );
                    viewer.hySetSceneIdToHotspot( this.hotspot_selected.id, sceneId );
                    this.initTargetView( {
                        panorama: viewer.getConfig().scenes[sceneId].panorama,
                        pitch: this.hotspot_selected.targetPitch,
                        yaw: this.hotspot_selected.targetYaw,
                    } );
                }
            }

            if( e.target.classList[0] === 'woore-checkbox-input' ) {
                const sceneId = this.scene_selected.id,
                    checkboxVal = $( e.target ).prop( "checked" );
                if ( checkboxVal ) {
                    viewer.hyUpdateScene(sceneId, {hy_isDefault: checkboxVal });
                    this.addIconSceneDefault( this.scene_selected );
                }else {
                    $( e.target ).prop( "checked", true );
                }
                showToastChange();
            }
        },

        keydown(e) {
            const sceneId = this.scene_selected.id,
                targetValue = $( e.target ).val();
            if ( e.key === "Backspace" ) {
                switch ( e.target.classList[0] ) {
                    default:
                }
            }
        },

        keyup(e) {
            const sceneId = this.scene_selected.id,
                targetValue = $( e.target ).val();

            switch ( e.target.classList[0] ) {
                case "woore-tour-scene-item-name-input":
                    $( `.woore-tour-sidebar-content[data-scene_id="${sceneId}"]`).find( ".woore-tour-scene-setting-name-input" ).val( targetValue );
                    viewer.hyUpdateScene(sceneId, {sceneName: targetValue });
                    showToastChange();
                    break;
                case "woore-tour-scene-setting-name-input":
                    $( `#${sceneId}` ).find( ".woore-tour-scene-item-name-input" ).val( targetValue );
                    viewer.hyUpdateScene(sceneId, {sceneName: targetValue });
                    showToastChange();
                    break;
                case "woore-tour-scene-setting-title-input":
                    viewer.hyUpdateScene(sceneId, {title: targetValue });
                    showToastChange();
                    break;
                case "woore-tour-hotspot-text":
                    viewer.hyUpdateHotSpot( this.hotspot_selected.id, undefined,{text: targetValue });
                    showToastChange();
                    break;
                default:
            }
        },

        drop(e) {
            this.isDrop = e.target.closest( "#woore-tour-panorama" ) !== null;
        },

        dragOver(e) {
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'copy';
        },

        dragStart(e){
            const _this = e.data.self;
            _this.ele_selected = this;
        },

        dragEnd(e) {
            const _this = e.data.self;
            if ( _this.isDrop && _this.ele_selected ) {
                if ( $( _this.ele_selected ).attr("id") !== viewer.getScene() ) {
                    let location = viewer.mouseEventToCoords( e ),
                        id = wooreGenerateID();
                    let hs = {
                        pitch: location[0],
                        yaw: location[1],
                        type: "scene",
                        sceneId: $( _this.ele_selected ).attr("id"),
                        targetYaw: 0,
                        targetPitch: 0,
                        hy_opacity: 1,
                        hy_dimension: 26,
                        cssClass: "vi-hui-hotspot pnlm-hotspot-base pnlm-hotspot pnlm-tooltip",
                        id: id,
                        draggable: true,
                        dragHandlerFunc: function (evet, hs) {
                            if ( evet.type === "mouseup" ){
                                let location = hs.viewer.mouseEventToCoords( evet );
                                let hotSpots = hs.viewer.getConfig().hotSpots;
                                let hotSpot = hotSpots.filter(function (hotspot) {
                                    return hotspot.id === hs.id;
                                });

                                if ( (location[0] === hotSpot[0].pitch) && (location[1] === hotSpot[0].yaw) ) {
                                    showToastChange();
                                }
                            }
                        },
                        dragHandlerArgs: {viewer :viewer, id: id},
                        clickHandlerFunc: function ( evet, hs) {
                            _this.renderHotspotSetting( viewer.getConfig().scenes, viewer.hyGetHotspot( hs.id ) );
                            _this.hotspot_selected = viewer.hyGetHotspot( hs.id );
                        },
                        clickHandlerArgs: {viewer :viewer, id: id},
                    };
                    viewer.addHotSpot(hs, undefined );
                    _this.hotspot_selected = viewer.hyGetHotspot( hs.id );
                    _this.renderHotspotSetting( viewer.getConfig().scenes, viewer.hyGetHotspot( hs.id ) );
                }else {
                    viHuiToast({
                        title: VicWreParams.i18n.error,
                        message: VicWreParams.i18n.scene_to_itself,
                        type: "error",
                        duration: 3000,
                    });
                }
            }
            _this.ele_selected = null;
            _this.drag = false;
        },

        click(e) {
          const _this = this;
          this.ele_selected = e.target;

            if ( e.target.closest( ".woore-tour-scene-item" ) !== null ) {
                this.ele_selected = e.target.closest( ".woore-tour-scene-item" );
            }

            if ( e.target.closest( ".woore-tour-scene-item-control" ) !== null ) {
                this.ele_selected = e.target.closest( ".woore-tour-scene-item-control" );
            }

            if ( e.target.closest( ".woore-tour-scene-setting-image" ) !== null ) {
                this.ele_selected = e.target.closest( ".woore-tour-scene-setting-image" );
            }

          switch (this.ele_selected.classList[0]) {
              case "woore-tour-scene-item":
                  if ( ! $( this.ele_selected ).hasClass( "active" ) ) {
                      $( ".woore-tour-sidebar-editor-button.active" ).removeClass( "active" );
                      $( '.woore-tour-sidebar-editor-button[data-action="scene"]' ).addClass( "active" );

                      $( this.scene_selected ).removeClass( "active" );
                      $( this.ele_selected ).addClass( "active" );
                      this.scene_selected = this.ele_selected;
                      this.renderSceneSetting( viewer.getConfig().scenes[ this.ele_selected.id ], this.ele_selected.id );
                      viewer.hySetScene( this.ele_selected.id );
                      viewer.hyUpdateScene( this.ele_selected.id , {hy_isActive: true} );
                      this.hotspot_selected = null;
                  }
                  break;
              case "woore-tour-scene-item-control":
                  let scene = this.ele_selected.closest( ".woore-tour-scene-item" ),
                      listScene = $( scene ).parent();
                  if ( scene ) {
                      let sceneId = $( scene ).attr( "id" ),
                          sceneImage = $( scene ).find( "img" ),
                          sceneSettingContent = $( `.woore-tour-sidebar-content[data-scene_id="${sceneId}"]`);

                      if ( $( this.ele_selected ).data( "action" ) === 'update' ) {

                          let mediaUploader = wp.media( {
                              title: VicWreParams.i18n.add_scene,
                              button: {
                                  text: VicWreParams.i18n.select,
                              },
                              multiple: false,
                          } );

                          mediaUploader.on( "select", function (){

                              let attachment = mediaUploader.state().get( "selection" ).first().toJSON();

                              if ( 0 > attachment.url.trim().length ) {
                                  return;
                              }

                              let data = {
                                  panorama: attachment.url,
                              }
                              if ( sceneImage.length > 0 ) {
                                  viewer.hyUpdateScene( sceneId, data );
                                  sceneImage.attr( "src", data.panorama );
                                  if ( sceneSettingContent.get(0) ) {
                                      sceneSettingContent.find( ".woore-tour-scene-setting-image img" ).attr( "src", data.panorama );
                                  }

                                  if ( _this.hotspot_selected && ( sceneId === $( "#woore-target-scene" ).val() ) ) {
                                      _this.hotspot_selected = viewer.hyGetHotspot( _this.hotspot_selected.id );
                                      _this.initTargetView( {
                                          panorama: data.panorama,
                                          pitch: _this.hotspot_selected.targetPitch,
                                          yaw: _this.hotspot_selected.targetYaw,
                                      } );
                                      _this.renderHotspotSetting( viewer.getConfig().scenes, _this.hotspot_selected );
                                  }
                                  showToastChange();
                              }
                          } );

                          mediaUploader.open();
                      }

                      if ( $( this.ele_selected ).data( "action" ) === 'remove' ) {

                          if ( confirm( VicWreParams.i18n.alert_delete_scene ) ) {
                              let isSceneActive = scene.classList.contains( "active" );
                              let isSceneDefault = scene.classList.contains( "default" );
                              viewer.hySetScene( "" );
                              viewer.removeScene( sceneId );
                              scene.remove();

                              let firstScene = listScene.find( ".woore-tour-scene-item" ).first();

                              if ( isSceneDefault ) {
                                  this.addIconSceneDefault( firstScene );
                                  let sceneSidebar = $( `.woore-tour-sidebar-content[data-scene_id="${firstScene.attr( "id" )}"]` );
                                  sceneSidebar.find( `#scene-setting-${firstScene.attr( "id" )}` ).trigger( "change" );
                                  viewer.hyUpdateScene( firstScene.attr( "id" ), { hy_isDefault: true} );
                              }

                              if ( isSceneActive ) {
                                  let firstScene = listScene.find( ".woore-tour-scene-item" ).first();
                                  if ( firstScene.length > 0 ) {
                                      firstScene.addClass( "active" );
                                      viewer.loadScene( firstScene.attr( "id" ) );
                                      this.scene_selected = firstScene.get(0);
                                      this.renderSceneSetting( viewer.getConfig().scenes[this.scene_selected.id], this.scene_selected.id );
                                  }else {
                                      this.scene_selected = null;
                                  }
                                  viewer.hySetScene( firstScene.attr( "id" ) );

                              }else {
                                  viewer.hySetScene( this.scene_selected.id );
                                  if ( this.hotspot_selected ) {
                                      if ( sceneId === this.hotspot_selected.sceneId ) {
                                          viewer.hySetSceneIdToHotspot( this.hotspot_selected.id, "" );
                                      }
                                      this.renderHotspotSetting( viewer.getConfig().scenes, viewer.hyGetHotspot( this.hotspot_selected.id ) );
                                  }
                              }

                              showToastChange();
                              this.countScene--;
                              this.checkScene();
                          }
                      }
                  }
                  break;
              case "woore-tour-sidebar-editor-button":
                  let action = $( this.ele_selected ).data( "action" );

                  if ( action === "scene" && ! $( this.ele_selected ).hasClass( "active" ) ) {
                      $( ".woore-tour-sidebar-editor-button.active" ).removeClass( "active" );
                      $( ".vi-hui-hotspot.active" ).removeClass( "active" );

                      $( this.ele_selected ).addClass( "active" );
                      this.renderSceneSetting( viewer.getConfig().scenes[this.scene_selected.id], this.scene_selected.id );
                      this.hotspot_selected = null;
                  }
                  break;
              case "woore-tour-scene-setting-image":
                  e.preventDefault();
                  if ( this.scene_selected ) {
                      let sceneId = $( this.scene_selected ).attr( "id" ),
                          sceneImage = $( this.scene_selected ).find( "img" ),
                          sceneSettingImage = $( this.ele_selected ).find( "img" );

                      let mediaUploader = wp.media( {
                          title: VicWreParams.i18n.add_scene,
                          button: {
                              text: VicWreParams.i18n.select,
                          },
                          multiple: false,
                      } );

                      mediaUploader.on( "select", function (){

                          let attachment = mediaUploader.state().get( "selection" ).first().toJSON();

                          if ( 0 > attachment.url.trim().length ) {
                              return;
                          }

                          let data = {
                              panorama: attachment.url,
                          }
                          if ( sceneImage.length > 0 ) {
                              viewer.hyUpdateScene( sceneId, data );
                              sceneImage.attr( "src", data.panorama );
                              sceneSettingImage.attr( "src", data.panorama );
                              showToastChange();
                          }
                      } );

                      mediaUploader.open();
                  }
                  break;
              case "woore-button-delete-scene":
                  if ( confirm( VicWreParams.i18n.alert_delete_scene ) ) {
                      let sceneId = this.scene_selected.id;

                      this.scene_selected.remove();
                      viewer.hySetScene( "" );
                      let firstScene = $( ".woore-tour-scene-list" ).find( ".woore-tour-scene-item" ).first();

                      if ( firstScene.length > 0 ) {
                          firstScene.addClass( "active" );
                          viewer.loadScene( firstScene.attr( "id" ) );
                          this.scene_selected = firstScene.get(0);
                          this.addIconSceneDefault( firstScene );
                          this.renderSceneSetting( viewer.getConfig().scenes[this.scene_selected.id], this.scene_selected.id );
                      }else {
                          this.scene_selected = null;
                          $( "#woore-tour-sidebar-editor" ).html("");
                      }

                      viewer.removeScene( sceneId );
                      showToastChange();
                      this.countScene--;
                      this.checkScene();
                  }
                  break;
              case "woore-tour-save-target-view":
                  if ( this.targetViewer ) {
                      viewer.hyUpdateHotSpot( this.hotspot_selected.id, undefined,{targetPitch: this.targetViewer.getPitch(), targetYaw: this.targetViewer.getYaw() });
                      showToastChange();
                  }
                  break;
              case "woore-button-delete-hotspot":
                  if ( confirm( VicWreParams.i18n.alert_delete_hotspot ) ) {
                      if ( this.hotspot_selected ) {
                          viewer.removeHotSpot( this.hotspot_selected.id, this.scene_selected.id );
                          $( '.woore-tour-sidebar-editor-button[data-action="scene"]' ).trigger( "click" );
                      }
                  }
                  break;
              default :
          }
        },

        mouseup(e) {
            if ( this.scene_selected ) {

                const sceneId = this.scene_selected.id,
                    targetValue = $( e.target ).val();
                switch ( e.target.classList[0] ) {
                    case "woore-tour-slider":
                        let sliderValue = $( e.target ).parent().find( ".woore-tour-slider-value" );
                        $( sliderValue ).html( targetValue );
                        this.updateSliderToScene( sceneId, e.target );
                        break;
                    default:
                }

            }

        },

        loadScenes() {
            const scenes = viewer.getConfig().scenes;
            for ( const sceneId in scenes ) {
                scenes[sceneId].id = sceneId;
                this.renderScene( scenes[sceneId] );
            }
        },

        addScene(e) {
            const _this = e.data.self;
            let mediaUploader = wp.media( {
                title: VicWreParams.i18n.add_scene,
                button: {
                    text: VicWreParams.i18n.select
                },
                multiple: true,
            } );

            mediaUploader.on( "select", function (){

                let attachments = mediaUploader.state().get('selection').map(
                    function( attachment ) {
                        attachment.toJSON();
                        return attachment;
                    });

                if ( attachments.length > 0 ) {
                    for ( let i = attachments.length - 1; i >= 0 ; --i ) {
                        if ( 0 > attachments[i].attributes.url.trim().length ) {
                            continue;
                        }

                        let data = {
                            panorama: attachments[i].attributes.url,
                        }

                        let sceneConfig = _this.renderScene( data );
                        if ( _this.countScene <= 0 ) {

                            viewer = pannellum.viewer( "woore-tour-panorama", {
                                "huiStatus": 'editor',
                                "default": {
                                    "firstScene": sceneConfig[0],
                                    "sceneFadeDuration": 1000,
                                    "showControls": false,
                                    "disableKeyboardCtrl": true,
                                    "keyboardZoom": false,
                                },
                                "scenes": {
                                    [sceneConfig[0]]: sceneConfig[1],
                                }
                            } );

                            viewer.hySetScene( sceneConfig[0] );
                            viewer.hyUpdateScene( sceneConfig[0], {hy_isActive: true, hy_isDefault: true} );
                            let scene = $( `#${sceneConfig[0]}` );
                            scene.addClass( "active" );
                            _this.scene_selected = scene.get(0);
                            _this.renderSceneSetting( sceneConfig[1], sceneConfig[0] );
                            _this.addIconSceneDefault( scene );
                        }else {
                            viewer.addScene( sceneConfig[0], sceneConfig[1] );
                        }
                        _this.countScene++;
                    }
                }
                if ( _this.hotspot_selected ) {
                    _this.renderHotspotSetting( viewer.getConfig().scenes, _this.hotspot_selected );
                }
                showToastChange();
                _this.checkScene();
            } );

            mediaUploader.open();
        },

        renderScene(data =  {}) {
            let { id, panorama, sceneName, hy_isActive } = data;

            sceneName = sceneName || 'Scene ' + this.countScene;
            id = id || wooreGenerateID();

            let scene =  $(`<div id="${id}" class="woore-tour-scene-item ${hy_isActive ? 'active' : ''}" draggable="true">
                                <div class="woore-tour-scene-item-controls">
                                    <div class="woore-tour-scene-item-control" data-action="update" title="${VicWreParams.i18n.change_media}">
                                        <span class="dashicons dashicons-update"></span>
                                    </div>
                                    <div class="woore-tour-scene-item-control" data-action="remove" title="${VicWreParams.i18n.remove_scene}">
                                        <span class="dashicons dashicons-trash"></span>
                                    </div>
                                </div>
                                <div class="woore-tour-scene-item-name">
                                    <input type="text" class="woore-tour-scene-item-name-input" placeholder="${VicWreParams.i18n.scene_name}" value="${sceneName}">
                                </div>
                                <img src="${panorama}" alt="">
                                <span class="dashicons dashicons-star-filled woore-icon-scene-default" title="${VicWreParams.i18n.first_scene}"></span>
                            </div>`);
            let listScene = $( ".woore-tour-scene-list" );
            listScene.append( scene );

            return [ id, { panorama, sceneName } ];
        },

        checkScene() {
            if (!viewer) {
                return false;
            }

            if ( viewer.getConfig().scenes ) {
                if ( Object.keys( viewer.getConfig().scenes ).length <= 0 ) {
                    $( ".woore-tour-box-add-scene" ).show();
                    if (viewer) {
                        viewer.destroy();
                        viewer = null;
                    }
                    return false;
                }else {
                    $( ".woore-tour-box-add-scene" ).hide();
                }
            }
            return true;
        },

        hotspotClick(e) {
            let activeHotspot = $( ".vi-hui-hotspot.active" );
            if ( activeHotspot.length > 0 ) {
                activeHotspot.removeClass( "active" );
            }
            $( this ).addClass( "active" );
        },

        loadSlider() {
            let sliders = $( ".woore-tour-slider" );
            sliders.each( function () {
                let sliderValue = $( this ).parent().find( ".woore-tour-slider-value" );
                $( sliderValue ).html( $( this ).val() );
            } );
        },

        updateSliderToScene( sceneId, slider ) {
            const sliderValue = $( slider ).val(),
                sliderType = $( slider ).data("type");
            switch ( sliderType ) {
                case "pitch-limit":
                    viewer.hyUpdateScene(sceneId, {maxPitch : +sliderValue, minPitch: -sliderValue });
                    showToastChange();
                    break;
                case "initial-zoom":
                    viewer.hyUpdateScene(sceneId, {hfov: +sliderValue + 50});
                    showToastChange();
                    break;
                case "opacity-zoom":
                    viewer.hyUpdateHotSpot( this.hotspot_selected.id, undefined, {hy_opacity: sliderValue/100} );
                    showToastChange();
                    break;
                case "dimension":
                    viewer.hyUpdateHotSpot( this.hotspot_selected.id, undefined,  {hy_dimension: sliderValue} );
                    showToastChange();
                    break;
                default:
            }
        },

        renderSceneSetting( data = {}, sceneId ) {
            let { hfov, minPitch, maxPitch, title, panorama, sceneName, hy_isDefault } = data;
            hy_isDefault = hy_isDefault ?? false;
            hfov = ( hfov-50 ) ?? 0;
            minPitch = minPitch ?? -180;
            maxPitch = maxPitch ?? 180;
            title = title ?? '';
            const sceneSetting =  $(`                            
                            <div class="woore-tour-sidebar-content woore-mt16" data-scene_id="${sceneId}">
                                <div class="woore-tour-field checkbox-field">
                                <span class="woore-tour-field-title">${VicWreParams.i18n.scene_default}</span>
                                <div>
                                    <label for="scene-setting-${sceneId}" class="woore-checkbox">
                                        <input type="checkbox" id="scene-setting-${sceneId}" class="woore-checkbox-input" ${hy_isDefault ? 'checked': ''}>
                                        <span></span>
                                    </label>
                                </div>
                                </div>
                                <div class="woore-tour-field image-field">
                                    <span class="woore-tour-field-title">${VicWreParams.i18n.scene_image}</span>
                                    <a href="#" class="woore-tour-scene-setting-image woore-custom-media ${panorama ? "remove" : ''}">
                                        <img src="${panorama}" alt="">
                                    </a>
                                </div>
                                <div class="woore-tour-field input-field">
                                    <label for="">${VicWreParams.i18n.scene_name}</label>
                                    <input type="text" value="${sceneName}" class="woore-tour-scene-setting-name-input">
                                </div>
                                <div class="woore-tour-field input-field">
                                    <label for="">${VicWreParams.i18n.title}</label>
                                    <input type="text" class="woore-tour-scene-setting-title-input" value="${title}">
                                </div>
                                <div class="woore-tour-field">
                                    <label for="">${VicWreParams.i18n.pitch_limit}</label>
                                    <div class="woore-tour-slider-container">
                                        <input type="range" min="0" max="180" value="${maxPitch}" step="1" class="woore-tour-slider" data-type="pitch-limit">
                                        <p><span class="woore-tour-slider-value"></span>&deg;</p>
                                    </div>
                                </div>

                                <div class="woore-tour-field">
                                    <label for="">${VicWreParams.i18n.initial_zoom}</label>
                                    <div class="woore-tour-slider-container">
                                        <input type="range" min="0" max="70" value="${hfov}" step="1" class="woore-tour-slider" data-type="initial-zoom">
                                        <p><span class="woore-tour-slider-value"></span></p>
                                    </div>
                                </div>
                                <div class="woore-button-delete-scene woore-button-delete">
                                    ${VicWreParams.i18n.delete_scene}
                                </div>
                            </div>` );
            $( "#woore-tour-sidebar-editor" ).html( sceneSetting );
            this.loadSlider();

        },

        renderHotspotSetting( scenes, hotspot ) {
            let { id, sceneId, hy_opacity, hy_dimension, text, div, targetPitch, targetYaw } = hotspot;

            if ( ! $( div ).hasClass( "active" ) ) {
                $( ".vi-hui-hotspot.active" ).removeClass( "active" );
                $( div ).addClass( "active" );
            }

            let selectScenes = [],
                initialTargetScene = {
                    panorama: "",
                    pitch: targetPitch ?? 0,
                    yaw: targetYaw ?? 0,
                    hfov: 100,
                };
            for ( const scene in scenes ) {
                if ( scene !== this.scene_selected.id ) {
                    selectScenes.push( {key: scene, value: scenes[scene].sceneName} );
                }
                if ( scene === sceneId ) {
                    initialTargetScene.panorama = scenes[scene].panorama;
                }
            }

            const selectOptionHtml = ( selectScene, sceneId ) => {
                let optionsHtml = [];
                optionsHtml.push( `<option value="">${VicWreParams.i18n.none}</option>` );
                for (const selectScene of selectScenes ) {
                    optionsHtml.push( `<option value="${selectScene.key}" ${selectScene.key === sceneId ? "selected" : ''}>${selectScene.value}</option>` )
                }
                return optionsHtml.join("");
            };

            $( ".woore-tour-sidebar-editor-button.active" ).removeClass( "active" );
            $( '.woore-tour-sidebar-editor-button[data-action="hotspot"]' ).addClass( "active" );
            const hotspotSetting = $( `
              <div class="woore-tour-sidebar-content woore-mt16">
                                <div class="woore-tour-field">
                                    <p class="form-row woore-mtb0 form-field">
                                        <label for="woore-target-scene">${VicWreParams.i18n.target_scene}</label>
                                        <select id="woore-target-scene" name="" class="select short">
                                            ${selectOptionHtml( selectScenes, sceneId )}
                                        </select>
                                    </p>
                                    <div class="woore-tour-field-target-view woore-mt16">
                                        <span>${VicWreParams.i18n.set_target_view}</span>
                                        <div id="woore-target-panorama"></div>
                                        <div class="woore-tour-save-target-view button button-primary">${VicWreParams.i18n.save}</div>
                                    </div>
                                </div>
                                <div class="woore-tour-field">
                                    <label for="">${VicWreParams.i18n.opacity_zoom}</label>
                                    <div class="woore-tour-slider-container">
                                        <input type="range" min="0" max="100" value="${hy_opacity ? hy_opacity * 100 : 100}" step="1" class="woore-tour-slider" data-type="opacity-zoom">
                                        <p><span class="woore-tour-slider-value"></span>%</p>
                                    </div>
                                </div>
                                <div class="woore-tour-field">
                                    <label for="">${VicWreParams.i18n.dimension}</label>
                                    <div class="woore-tour-slider-container">
                                        <input type="range" min="26" max="99" value="${hy_dimension ?? 26}" step="1" class="woore-tour-slider" data-type="dimension">
                                        <p><span class="woore-tour-slider-value"></span>px</p>
                                    </div>
                                </div>
                                <div class="woore-tour-field input-field">
                                    <label for="">${VicWreParams.i18n.text}</label>
                                    <textarea name="" id="" cols="30" rows="5" class="woore-tour-hotspot-text">${text ?? ""}</textarea>
                                </div>
                                <div class="woore-button-delete-hotspot woore-button-delete">${VicWreParams.i18n.delete_hotspot}</div>
                            </div>` );
            $( "#woore-tour-sidebar-editor" ).html( hotspotSetting );
            this.initTargetView( initialTargetScene );
            this.loadSlider();
        },

        initTargetView( data ) {

            if ( this.targetViewer ) {
                this.targetViewer.destroy();
                this.targetViewer = null;
            }

            if ( data.panorama.trim() === "" ) {
                $( ".woore-tour-field-target-view" ).hide();
            }else {
                this.targetViewer = pannellum.viewer( "woore-target-panorama", {
                    "type": "equirectangular",
                    "panorama": data.panorama,
                    "autoLoad": true,
                    "showControls": false,
                    "pitch": data.pitch ?? 0,
                    "yaw": data.yaw ?? 0,
                    "hfov": 100,
                } );
            }
        },

        handleButtonPreview(e) {
            const _this = e.data.self;
            if (_this.isPreviewOpen) {
                let data = ViWre.Builder.getDataTour();

                _this.previewViewer = pannellum.viewer( "woore-tour-preview", data );
                $( ".woore-tour-container" ).animate( {height: '0px', minHeight: '0px'}, 400);
                $( "#woore-tour-preview" ).animate({height: '622px'}, 400);
                $( this ).find( ".dashicons-arrow-up-alt2" ).show();
                $( this ).find( ".dashicons-arrow-down-alt2" ).hide();
            }else {
                if (_this.previewViewer) {
                    _this.previewViewer.destroy();
                    _this.previewViewer = null;
                }
                $( ".woore-tour-container" ).animate( {height: '100%', minHeight: '600px'}, 400);
                $( "#woore-tour-preview" ).animate({height: '0px'}, 400);
                $( this ).find( ".dashicons-arrow-up-alt2" ).hide();
                $( this ).find( ".dashicons-arrow-down-alt2" ).show();
            }
            _this.isPreviewOpen = !_this.isPreviewOpen;
        },

        addIconSceneDefault( scene ) {
            if ( $( scene ).get(0) ) {
                $( '.woore-tour-scene-item.default' ).removeClass( 'default' );
                $( scene ).addClass( 'default' );
            }
        },

    }

    ViWre.Panellum.init();

    ViWre.Builder = {
        indexFloor: 0,
        indexScene: 0,
        indexHotspot: {},
        vicWreParams: VicWreParams,

        init: function () {
            const self = this;
            self.load();
            self.windowEvent();
            self.loadAddFloor();
            self.loadGoogleMap();
            self.uploadLocalVideo();
            self.validateWOOREInputNumber();
            self.handleFloorName();
            self.handleVirtualTour();
            self.handleChangeRealEstateType();
        },

        windowEvent: function () {

            $( document.body ).on( "click", ( e ) => {

                if ( e.target.closest( ".woore-panel-close" ) ) {
                    let floorClose = e.target.closest( ".woore-panel-close" );
                    let floor = floorClose.closest( ".woore-panel-header" ).parentElement;
                    $( floor ).remove();
                }

                if ( e.target.closest( ".woore-panel-switch" ) ) {
                    let floorSwitch = e.target.closest( ".woore-panel-switch" );
                    let floorItem = floorSwitch.closest( ".woore-panel-item" );
                    floorItem.classList.toggle( "active" );
                    $( floorItem.lastElementChild ).slideToggle( 400 );
                }

            } );

            $( document.body ).on( "keydown", ( e ) => {
                if ( e.key === "Escape" ) {
                    const modal = $( ".vi-hui-modal" );
                    modal.hide();
                    $( document.body ).css( "overflow", "auto" );

                    if ( ! ViWre.Panellum.isPreviewOpen ) {
                        $( "#woore-tour-preview-button" ).trigger( "click" );
                    }
                }
            } );
        },

        loadGoogleMap() {
            const self = this;
            $( ".location_options" ).on( "click", function () {
                if ( self.vicWreParams.googleMapAPI !== '' ) {
                    ViWre.Map.init();
                }
            } );
        },

        load: function () {
            const self = this,
                productType = $( "#product-type" ),
                salePrice = $( "#woocommerce-product-data ._sale_price_field" );

            if ( productType.val() === 'real-estate' ) {
                salePrice.hide();
            }else {
                salePrice.show();
            }

            productType.on("change", function () {
                if ( productType.val() === 'real-estate' ) {
                    salePrice.hide();
                }else {
                    salePrice.show();
                }
            } );

            self.indexFloor = $( ".woore-panel-item" ).length;
            if ( 0 === self.indexFloor ) {
                this.addFloor( "#woore-floor-items" );
                this.createEditor( `woore-wp-editor-${ self.indexFloor - 1 }` );
                this.triggerInitToolTips();
            }

            $( "#_woorealestate_country" ).select2({
                width: '100%',
            });
        },

        loadAddFloor: function () {
            const self = this;
            $( "#wre-add-floor" ).on( "click", ( e ) => {
                e.preventDefault()
                this.closePanelItems("#woore-floor-items");
                this.addFloor( "#woore-floor-items" );
                this.createEditor( `woore-wp-editor-${ self.indexFloor - 1 }` );
                this.validateWOOREInputNumber();
                this.triggerInitToolTips();

                ViWre.CustomMedia.loadAddImage( `.woore-floor-image[data-index="${ self.indexFloor - 1 }"]`, mediaProperties);
            });
        },

        addFloor: function ( container ) {
            let index = this.indexFloor;
            let html = $( `<div class="woore-panel-item active">
                <div class="woore-panel-header">
                
                    <h4 class="woore-panel-header-title">${this.vicWreParams.i18n.floor}</h4>
                    
                    <div class="woore-panel-wrap-icon">
                    
                        <div class="woore-panel-close">
                            <span class="dashicons dashicons-no-alt"></span>
                        </div>
                        
                        <div class="woore-panel-switch">
                            <div></div>
                            <div></div>
                        </div>
                        
                    </div>

                </div>
                <div class="woore-panel-content">
                
                    <div class="woore-product-page-wrapper">
                        <h4>${this.vicWreParams.i18n.floor_plan_image}</h4>
                        <div class="woore-floor-image-wrapper woore-mb16">
                        
                            <a href="#" class="woore-custom-media woore-floor-image" data-index="${index}">
                                <img src="" alt="">
                                <input type="hidden" name="woorealestate_property_floor[${index}][image_id]" >
                                <span></span>
                            </a>
                          
                        </div>
                    
                    </div>
                    

                    <div class="woore-product-page-wrapper">

                        <p class="form-field form-row form-row-first">
                            <label for="woorealestate_property_floor_name${index}">${this.vicWreParams.i18n.floor_name}</label>
                            <span class="woocommerce-help-tip" tabindex="0" aria-label="${this.vicWreParams.i18n.example_name}" data-tip="${this.vicWreParams.i18n.example_name}"></span>
                            <input type="text" class="short woore_property_floor_name" style="" name="woorealestate_property_floor[${index}][name]" id="woorealestate_property_floor_name${index}" value="" placeholder="">
                        </p>

                        <p class="form-field form-row form-row-last">
                            <label for="woorealestate_property_floor_size${index}">${this.vicWreParams.i18n.floor_size}</label>
                            <span class="woocommerce-help-tip" tabindex="0" aria-label="${this.vicWreParams.i18n.example_size}" data-tip="${this.vicWreParams.i18n.example_size}"></span>
                            <input type="number" min="0" class="woore-input_number short" style="" name="woorealestate_property_floor[${index}][size]" id="woorealestate_property_floor_size${index}" value="" placeholder="">
                        </p>

                        <div class="clear"></div>

                    </div>

                    <div class="woore-product-page-wrapper woore-mb16">
                    
                       <h4>${this.vicWreParams.i18n.additional_details}</h4>
                       <textarea id="woore-wp-editor-${index}" class="woore-w100" name="woorealestate_property_floor[${index}][additional_detail]"></textarea>
                    </div>
                    
                </div>
            </div>` );

            html.find( ".woore_property_floor_name" ).on( "keyup", function () {
                html.find( ".woore-panel-header-title" ).html( $(this).val() );
            } );

            $( container ).append( html );
            this.indexFloor++;
        },

        createEditor: function ( editorId ) {
            wp.editor.initialize( editorId, {
                tinymce: tinymce.settings,
                quicktags:true,
            } );
        },

        closePanelItems: ( selector ) => {
            const floorItems = $( selector ).children();
            const amountFloorItems = floorItems.length;
            if ( amountFloorItems === 0 ) {
                return;
            }

            floorItems.each( function(index, element) {
                if ( element.classList.contains( "active" ) ) {
                    element.classList.remove( "active" );
                    $( element.lastElementChild ).slideUp ( 300 );
                }
            } );

        },

        triggerInitToolTips: () => {
            $( document.body ).trigger( 'init_tooltips' );
        },

        uploadLocalVideo: function () {
            let self = this;

            $( "#woore-video-upload" ).on( "click", function ( e ) {
                e.preventDefault();
                let default_mine_type =  _wpPluploadSettings.defaults.filters.mime_types[0].extensions;
                _wpPluploadSettings.defaults.filters.mime_types[0].extensions = 'mp4,ogg,webm';

                const mediaUploader = wp.media( {
                    title: self.vicWreParams.i18n.choose_video,
                    button: {
                        text: self.vicWreParams.i18n.select,
                    },
                    multiple: false,
                    library: {
                        type: ['video'],
                    },
                } );

                mediaUploader.on( "select", function () {
                    let attachment = mediaUploader.state().get( "selection" ).first().toJSON();
                    if ( 0 > attachment.url.trim().length ) {
                        return;
                    }
                    $( "#woorealestate_video_url" ).val( attachment.url );
                } );

                mediaUploader.open();

                setTimeout(function (mine_type){
                    _wpPluploadSettings.defaults.filters.mime_types[0].extensions = mine_type;
                }, 100, default_mine_type);

            } );
        },

        handleVirtualTour: function() {
            const btnOpenTourEditor = $( "#woore-tour-open-editor" );
            btnOpenTourEditor.on( "click", () => {
                $( "#woore-tour-editor-modal" ).show();
                $( document.body ).css( { overflow: "hidden"} );

                setTimeout( function () {
                    if (viewer) {
                        viewer.loadScene( viewer.getScene(), 0, 0, 100 );
                    }
                }, 100 );

            } );

            $( "#woore-tour-editor-modal" ).on( "click", ".dashicons-no-alt, .vi-hui-overlay", function ( e ) {
                $( "#woore-tour-editor-modal" ).hide();
                $( document.body ).css( { overflow: "auto" } );
                if ( ! ViWre.Panellum.isPreviewOpen ) {
                    $( "#woore-tour-preview-button" ).trigger( "click" );
                }

                if ( viewer?.getConfig() ) {
                    let scenes = viewer.getConfig().scenes;
                    for (const scenesKey in scenes) {
                        if (scenes[scenesKey].hy_isDefault) {
                            btnOpenTourEditor.find( "img" ).attr( "src", scenes[scenesKey].panorama );
                            btnOpenTourEditor.addClass( "woore-tour-created" );
                            break;
                        }
                    }
                }else {
                    btnOpenTourEditor.removeClass( "woore-tour-created" );
                }
            } );

            $( "#tour_auto_rotation" ).on( "change", function () {
                if ( $( this ).is( ":checked") ) {
                    $( ".woore-tour-auto-rotation" ).removeClass( "collapse" );
                } else {
                    $( ".woore-tour-auto-rotation" ).addClass( "collapse" );
                }
            } );

            $( "#tour_auto_load" ).on( "change", function () {
                if ( $( this ).is( ":checked") ) {
                    $( ".woore-tour-preview-image" ).addClass( "collapse" );
                } else {
                    $( ".woore-tour-preview-image" ).removeClass( "collapse" );
                }
            } );

            $ ( "#post" ).on( "submit", {self: this}, this.saveTour );
        },

        saveTour: function ( e ) {
            let _this = e.data.self;
            const _ajax = () => {
                let data = {
                    action: 'woore_save_virtual_tour',
                    nonce: _this.vicWreParams.nonce,
                    data: JSON.stringify( _this.getDataTour() ),
                    post_id: $( 'input[name="post_ID"]' ).val(),
                };
                $.ajax({
                    url: _this.vicWreParams.ajaxUrl,
                    type: 'post',
                    dataType: 'json',
                    data: data,
                    beforeSend: function (  ) {
                    },
                    success: function ( res ) {
                        if ( res ) {
                            console.log( res.data );
                        }
                    },
                    error: function ( res ) {
                        alert( res.data );
                        e.preventDefault();
                    },
                    complete: function () {
                    }
                });
            };

            _ajax();

        },

        getSettingsTour: function () {
            let data = {},
                tourOption = $( "#real_estate_tour_options" );
            data.default = {};
            data.default.autoLoad = tourOption.find( 'input[name$="-auto-load"]' ).prop( "checked" );
            data.default.showControls = tourOption.find( 'input[name$="-basic-control"]' ).prop( "checked" );
            data.default.sceneFadeDuration = tourOption.find( 'input[name$="-scene-fade-duration"]' ).val();
            data.default.checkAutoRotate = tourOption.find( 'input[name$="-auto-rotate-check"]').prop( "checked");

            if ( data.default.checkAutoRotate ) {
                data.default.autoRotate = tourOption.find( 'input[name$="-auto-rotate"]' ).val();
                data.default.autoRotateStopDelay = tourOption.find( 'input[name$="-auto-rotate-stop"]' ).val();
                if ( tourOption.find( 'input[name$="-auto-rotate-resume"]' ).val().trim() !== "" ) {
                    data.default.autoRotateInactivityDelay = tourOption.find( 'input[name$="-auto-rotate-resume"]' ).val();
                }
            }
            data.strings = {};
            if ( ! data.default.autoLoad ) {
                data.default.preview = tourOption.find( ".woore-custom-media img" ).attr( "src" );
                data.strings.loadButtonLabel = tourOption.find ( 'input[name$="-preview-title"]' ).val();
            }
            return data;
        },

        getDataTour: function () {

            let data = this.getSettingsTour();
            data.scenes = viewer !== null ? JSON.parse(JSON.stringify( viewer.getConfig().scenes )) : {};
            let firstScene = "";
            for (const sceneKey in data.scenes) {
                if ( data.scenes[sceneKey].hy_isDefault ) firstScene = sceneKey;

                if ( data.scenes[sceneKey].hotSpots ) {
                    for (const hotSpot of data.scenes[sceneKey].hotSpots ) {
                        delete hotSpot.clickHandlerArgs;
                        delete hotSpot.clickHandlerFunc;
                        delete hotSpot.dragHandlerArgs;
                        delete hotSpot.dragHandlerFunc;
                        delete hotSpot.draggable;
                    }
                }
            }

            if (viewer) {
                if ( firstScene ) {
                    data.default.firstScene = firstScene;
                } else {
                    data.default.firstScene = Object.keys(data.scenes)[0];
                }
            }

            return  data;

        },

        handleChangeRealEstateType: function () {
            $( "#_woorealestate_type" ).on( "change", function () {
                const priceSuffixField = $( "#_woorealestate_price_suffix" ).parent(),
                      depositField = $( "#_woorealestate_deposit" ).parent();

                priceSuffixField.toggleClass("woore_active");
                depositField.toggleClass("woore_active");

            } );
        },

        validateWOOREInputNumber: function () {
            $( ".woore-input_number" ).on( "input", function () {
                let value = $( this ).val();
                if ( value === '' || parseFloat( value ) < 0 ) {
                    $( this ).val( '' );
                }
            } );
        },

        handleFloorName: function () {
            $( ".woore_property_floor_name" ).each( function () {
                let floorItem = $( this ).closest( ".woore-panel-item" );
                $(this).on( "keyup", function () {
                    floorItem.find( ".woore-panel-header-title" ).html( $( this ).val() );
                } );
            } );
        },

    };


    ViWre.Builder.init();
    ViWre.CustomMedia.loadAddImage( ".woore-video-button", mediaProperties );
    ViWre.CustomMedia.loadAddImage( ".woore-tour-button", mediaProperties );
    ViWre.CustomMedia.loadAddImage( ".woore-floor-image", mediaProperties );
} );