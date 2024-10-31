if( ViWre === undefined ) {
   var ViWre = {};
}
jQuery( document ).ready( function ( $ ) {
   'use strict';

   ViWre.ShortcodeFormSearch = {
      init() {
         const container = $( ".woore-real-estate-search-page" );
         if ( container.length  > 1 ) {
            container[0].remove();
         }

         ViWre.ShortcodeFormSearchInit.init();
         if ( VicWreShortSearchParams.isSearchResult ) {
            this.currentPage = null;
            this.properties = null;
            this.data = null;
            container.on( "submit", "#woore_search_form",{ self: this }, this.submit );
            this.load()
         }
      },

      load() {
         let cleanUrl = location.protocol + "//" + location.host + location.pathname;
         window.history.replaceState({path: cleanUrl}, '', cleanUrl);
         if ( VicWreShortSearchParams.isCustomize ) {
            $( "#woore_search_form" ).trigger( "submit" );
         }
      },

      submit(e) {
         e.preventDefault();
         const _this = e.data.self;

         let data = {
            action: 'woore_real_estate_search',
            nonce: VicWreShortSearchParams.nonce,
            current_page: _this.currentPage === null ? 1 : _this.currentPage,
         }
         let formData = $("#woore_search_form").serializeArray();
         formData.forEach( function ( item ) {
            if ( item.value.trim().length > 0 ) {
               data[item.name] = item.value;
            }
         } );
         _this.data = data;

         $.ajax({
            url: VicWreShortSearchParams.ajaxUrl,
            type: 'post',
            dataType: 'json',
            data: data,
            async: true,
            beforeSend: function () {
               $( ".woore-real-estate-search-preview-processing-overlay" ).show();
            },
            success: function ( res ) {
               if ( res ) {
                  if ( res.products ) {
                     const productsList = $( "#woore-real-estate-search-products" ),
                         notFound = $( "#woore-real-estate-search-not-found" );

                     if ( res.products.length <= 0 ) {
                        productsList.hide();
                        notFound.show();
                     }else {
                        productsList.show();
                        notFound.hide();
                     }
                     _this.currentPage = res.current_page;
                     _this.renderProperties( res.products );
                     _this.renderPagination( res.current_page, res.total_page );
                  }
                  console.log( res.success );
               }
            },
            error: function ( res ) {
               if ( res ) {
                  console.log( res.data );
               }
            },
            complete: function () {
               $( ".woore-real-estate-search-preview-processing-overlay" ).hide();
            }
         });
      },

      renderPagination( currentPage, totalPage ) {
         const _this = this;
         const pagination = $( "#woore-real-estate-search-pagination" );
         let html = [];

         if ( currentPage > 1 && totalPage > 1 ) {
            html.push( `<li data-page="${currentPage-1}"><span class="dashicons dashicons-arrow-left"></span></li>` );
         }

         for ( let i = 1; i <= totalPage; i++ ) {
            if ( i === currentPage ) {
               html.push( `<li class="woore-real-estate-search-current-page">${i}</li>` );
            }else {
               html.push( `<li data-page="${i}">${i}</li>` );
            }
         }

         if ( currentPage < totalPage && totalPage > 1 ) {
            html.push( `<li data-page="${currentPage+1}"><span class="dashicons dashicons-arrow-right"></span></li>` );
         }

         pagination.html( html.join("") );

         pagination.find( "li:not(.woore-real-estate-search-current-page)" ).each( function () {
            $( this ).on( "click", function () {

               let data = _this.data;
               data.map_view = "";
               data.current_page = $( this ).data("page");

               $.ajax({
                  url: VicWreShortSearchParams.ajaxUrl,
                  type: 'post',
                  dataType: 'json',
                  data: data,
                  async: false,
                  beforeSend: function (  ) {
                  },
                  success: function ( res ) {
                     if ( res ) {
                        if ( res.products ) {
                           _this.currentPage = res.current_page;
                           _this.renderProperties( res.products );
                           _this.renderPagination( res.current_page, res.total_page)
                        }
                        console.log( res.success );
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
            } );
         } );
      },

      renderProperties( products ) {
         let html = [];
         $.each( products, function ( i, ele ) {
            html.push( `<div class="woore-real-estate-search-product ${(i+1) % 3 === 0 ? 'last' : ''} ${i % 3 === 0 ? 'first' : ''}">${ele.html}</div>` );
         } );
         $( "#woore-real-estate-search-products" ).html( html.join('') );
      }

   }

   ViWre.ShortcodeFormSearch.init();
}) ;