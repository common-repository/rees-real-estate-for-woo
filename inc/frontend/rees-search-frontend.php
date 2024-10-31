<?php

namespace REES\Inc\Frontend;

use REES\Inc\Data;

defined( 'ABSPATH' ) || exit;

class REES_Search_Frontend {
	protected $settings;
	protected $fields;
	protected $prefix;
	protected $fields_title;
	protected $button_type;
	protected $price_type;
	protected $size_type;

	protected static $instance = null;

	protected $suffix = WP_DEBUG ? '' : '.min';

	public function __construct() {
		$this->settings     = Data::get_instance();
		$this->fields       = json_decode( $this->get_params( 'fields' ), true );
		$this->fields_title = $this->settings->get_woore_search_fields_default();
		$this->button_type  = $this->get_params( 'button_search_type' );
		$this->price_type   = $this->get_params( 'price_search_type' );
		$this->size_type    = $this->get_params( 'size_search_type' );
		$this->prefix       = 'woore-real-estate-search-';

		add_action( 'wp_enqueue_scripts', array( $this, 'wp_enqueue_scripts' ) );
		add_action( 'init', array( $this, 'shortcode_init' ) );
		add_filter( 'content_pagination', array( $this, 'maybe_add_shortcode_to_page_content' ), 10, 2 );
		add_action( 'wp_footer', array( $this, 'wp_footer' ) );
		add_action( 'wp_ajax_woore_real_estate_page_layout', array( $this, 'apply_layout' ) );
		add_action( 'wp_ajax_woore_real_estate_search', array( $this, 'search' ) );
		add_action( 'wp_ajax_nopriv_woore_real_estate_search', array( $this, 'search' ) );
	}

	public static function instance() {
		return null === self::$instance ? self::$instance = new self() : self::$instance;
	}

	function handling_custom_meta_query_keys( $wp_query_args, $query_vars ) {
		if ( ! empty( $query_vars['meta_query'] ) ) {
			$wp_query_args['meta_query'][] = $query_vars['meta_query'];
		}

		return $wp_query_args;
	}

	function search() {
		if ( ! ( isset( $_POST['nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['nonce'] ), 'woorealestate_nonce' ) ) ) {
			return;
		}

		add_filter( 'woocommerce_product_data_store_cpt_get_products_query', array(
			$this,
			'handling_custom_meta_query_keys'
		), 10, 2 );

		$input_search     = isset( $_POST['input_search'] ) ? wc_clean( wp_unslash( $_POST['input_search'] ) ) : '';
		$min_price_search = isset( $_POST['min_price_search'] ) ? wc_clean( wp_unslash( $_POST['min_price_search'] ) ) : '';
		$max_price_search = isset( $_POST['max_price_search'] ) ? wc_clean( wp_unslash( $_POST['max_price_search'] ) ) : '';
		$min_size_search  = isset( $_POST['min_size_search'] ) ? wc_clean( wp_unslash( $_POST['min_size_search'] ) ) : '';
		$max_size_search  = isset( $_POST['max_size_search'] ) ? wc_clean( wp_unslash( $_POST['max_size_search'] ) ) : '';

		$args = array(
			'status' => 'publish',
			'type'   => 'real-estate',
			'limit'  => - 1,
		);

		$arr_meta_query = array( 'relation' => 'AND' );

		if ( $min_size_search && $max_size_search ) {
			$arr_meta_query[] = array(
				'key'     => '_woorealestate_size',
				'value'   => array( $min_size_search, $max_size_search ),
				'type'    => 'NUMERIC',
				'compare' => 'BETWEEN'
			);
		} else {
			if ( $min_size_search ) {
				$arr_meta_query[] = array(
					'key'     => '_woorealestate_size',
					'value'   => $min_size_search,
					'type'    => 'NUMERIC',
					'compare' => '>='
				);
			}
			if ( $max_size_search ) {
				$arr_meta_query[] = array(
					'key'     => '_woorealestate_size',
					'value'   => $max_size_search,
					'type'    => 'NUMERIC',
					'compare' => '<='
				);
			}
		}

		if ( $min_price_search && $max_price_search ) {
			$arr_meta_query[] = array(
				'key'     => '_regular_price',
				'value'   => array( $min_price_search, $max_price_search ),
				'type'    => 'NUMERIC',
				'compare' => 'BETWEEN'
			);
		} else {
			if ( $min_price_search ) {
				$arr_meta_query[] = array(
					'key'     => '_regular_price',
					'value'   => $min_price_search,
					'type'    => 'NUMERIC',
					'compare' => '>='
				);
			}
			if ( $max_price_search ) {
				$arr_meta_query[] = array(
					'key'     => '_regular_price',
					'value'   => $max_price_search,
					'type'    => 'NUMERIC',
					'compare' => '<=',
				);
			}
		}

		$args['meta_query'] = $arr_meta_query; // @codingStandardsIgnoreLine

		$products_query = wc_get_products( $args );
		$products       = array();

		if ( $input_search ) {
			$search_term = strtolower( $input_search );
		}

		foreach ( $products_query as $product ) {
			$title_lower = strtolower( $product->get_title() );
			if ( ! $input_search || strstr( $title_lower, $search_term ) ) {
				$products[] = array(
					'html' => do_shortcode( '[products columns=1 ids=' . $product->get_ID() . ']' )
				);
			}
		}

		$limit         = $this->get_params( 'search_result_limit' ) ? $this->get_params( 'search_result_limit' ) : 12;
		$current_page  = isset( $_POST['current_page'] ) ? wc_clean( wp_unslash( $_POST['current_page'] ) ) : 1;
		$total_records = count( $products );
		$total_page    = ceil( $total_records / $limit );

		if ( $current_page > $total_page ) {
			$current_page = $total_page;
		} else if ( $current_page < 1 ) {
			$current_page = 1;
		}

		$start = ( $current_page - 1 ) * $limit;

		$new_products = array();
		$i            = 0;
		while ( isset( $products[ $start ] ) && $i < $limit ) {
			$new_products[] = $products[ $start ];
			$start ++;
			$i ++;
		}

		wp_send_json( array(
			'products'     => $new_products,
			'total_page'   => intval( $total_page ),
			'current_page' => intval( $current_page ),
			'success'      => 'Search success',
		) );
		remove_filter( 'woocommerce_product_data_store_cpt_get_products_query', array(
			$this,
			'handling_custom_meta_query_keys'
		) );
		wp_die();
	}

	public function maybe_add_shortcode_to_page_content( $pages, $post ) {
		if ( count( $pages ) ) {
			$search_result_page = $this->get_params( 'search_result_page' );
			if ( $post && $post->ID == $search_result_page ) {
				if ( false === strpos( $post->post_content, '[woore_form_search]' ) ) {
					if ( ! is_customize_preview() ) {
						$pages[0] .= '<!-- wp:shortcode -->' . '[woore_form_search]' . '<!-- /wp:shortcode -->';
					} else {
						$pages[0] .= '<!-- wp:shortcode -->' . '[woore_form_search preview="on"]' . '<!-- /wp:shortcode -->';
					}
				}
			}
		}

		return $pages;
	}

	public function shortcode_init() {
		add_shortcode( 'woore_form_search', array( $this, 'shortcode_form_search' ) );
	}

	public function render_html( $field_key ) {
		$html = '';
		switch ( $field_key ) {
			case 'input_search':
				$html = $this->input_html( $field_key );
				break;
			case 'button_search':
				$html = $this->button_search_html( $field_key );
				break;
			case 'price_search':
				$html = $this->woore_form_search_fields_html( $field_key, $this->price_type );
				break;
			case 'size_search':
				$html = $this->woore_form_search_fields_html( $field_key, $this->size_type );
				break;
			default:
		}

		return $html;
	}


	public function apply_layout() {

		if ( isset( $_POST['new_val'], $_POST['nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['nonce'] ), 'woorealestate_nonce' ) ) {
			$new_val = sanitize_text_field( wp_unslash( $_POST['new_val'] ) );
			$old_val = isset( $_POST['old_val'] ) ? sanitize_text_field( wp_unslash( $_POST['old_val'] ) ) : '';

			$new_val = json_decode( $new_val, true );
			$old_val = json_decode( $old_val, true );

			$old_val['fields']             = isset( $old_val['fields'] ) ? json_decode( sanitize_text_field( stripslashes( $old_val['fields'] ) ) ) : $this->fields;
			$old_val['button_search_type'] = isset( $old_val['button_search_type'] ) ? sanitize_text_field( stripslashes( $old_val['button_search_type'] ) ) : $this->button_type;


			$this->fields      = isset( $new_val['fields'] ) ? json_decode( sanitize_text_field( stripslashes( $new_val['fields'] ) ) ) : $old_val['fields'];
			$this->button_type = isset( $new_val['button_search_type'] ) ? sanitize_text_field( stripslashes( $new_val['button_search_type'] ) ) : $old_val['button_search_type'];
			$this->price_type  = isset( $new_val['price_search_type'] ) ? sanitize_text_field( stripslashes( $new_val['price_search_type'] ) ) : $this->price_type;
			$this->size_type   = isset( $new_val['size_search_type'] ) ? sanitize_text_field( stripslashes( $new_val['size_search_type'] ) ) : $this->size_type;

			add_shortcode( 'woore_form_search', array( $this, 'shortcode_form_search' ) );

			wp_send_json( array(
				'formSearch' => do_shortcode( '[woore_form_search preview="on"]' ),
			) );
			wp_die();
		}

	}

	public function shortcode_form_search( $atts ) {
		$arr = shortcode_atts( array(
			'preview'           => '',
			'remove_duplicates' => ''
		), $atts );

		if ( $this->is_search_result_page() && ! empty( $arr['remove_duplicates'] ) ) {
			return '';
		}

		wp_enqueue_style( 'dashicons' );
		wp_enqueue_style( 'woore-frontend-shortcode-icons-style', REES_CONST_F['css_url'] . 'woore-icon' . $this->suffix . '.css', array(), REES_CONST_F['version'] );
		wp_enqueue_style( 'woore-frontend-shortcode-form-search-style', REES_CONST_F['css_url'] . 'frontend-shortcode-form-search' . $this->suffix . '.css', array(), REES_CONST_F['version'] );
		wp_enqueue_style( 'woore-select2-style', REES_CONST_F['libs_url'] . 'select2.min.css', '', REES_CONST_F['version'] );
		wp_enqueue_script( 'woore-select2-script', REES_CONST_F['libs_url'] . 'select2.min.js', array( 'jquery' ), REES_CONST_F['version'], false );
		wp_enqueue_script( 'woore-frontend-shortcode-form-search-init-script', REES_CONST_F['js_url'] . 'frontend-shortcode-form-search-init' . $this->suffix . '.js', array( 'jquery' ), REES_CONST_F['version'], false );
		wp_enqueue_script( 'woore-frontend-shortcode-form-search-script', REES_CONST_F['js_url'] . 'frontend-shortcode-form-search' . $this->suffix . '.js', array( 'jquery' ), REES_CONST_F['version'], true );
		wp_localize_script( 'woore-frontend-shortcode-form-search-script', 'VicWreShortSearchParams', array(
			'ajaxUrl'        => admin_url( 'admin-ajax.php' ),
			'nonce'          => wp_create_nonce( 'woorealestate_nonce' ),
			'isSearchResult' => $this->is_search_result_page(),
			'isCustomize'    => empty( $arr['preview'] ),
		) );

		$allowed_html = wp_kses_allowed_html( 'post' );

		$allowed_html['input'] = array(
			'class'       => array(),
			'id'          => array(),
			'name'        => array(),
			'value'       => array(),
			'type'        => array(),
			'placeholder' => array(),
		);

		ob_start();

		?>
        <div class="woore-real-estate-search-page <?php echo ! empty( $arr['preview'] ) ? esc_attr( 'woore-real-estate-search-page__customize' ) : ''; ?>">
            <form action="<?php echo $this->is_search_result_page() ? '' : esc_url( get_permalink( $this->get_params( 'search_result_page' ) ) ); ?>"
                  method="get" class="vi-hui-form" id="woore_search_form">
	            <?php wp_nonce_field( 'wrealestate_nonce', '_rees_nonce' ) ?>
                <div class="vi-hui-fields">
					<?php
					foreach ( $this->fields as $field_k => $field_v ) {
						if ( 'banner_search' === $field_k ) {
							foreach ( $field_v as $field_i ) {
								if ( ! empty( $field_i[1] ) ) {
									if ( ! empty( $this->render_html( $field_i[0] ) ) ) {
										echo wp_kses( $this->render_html( $field_i[0] ), $allowed_html );
									}
								}
							}
						}
					}
					?>

                </div>
            </form>
            <div id="<?php echo esc_attr( $this->set( 'products' ) ); ?>"></div>
            <ul id="<?php echo esc_attr( $this->set( 'pagination' ) ); ?>"></ul>
            <div id="<?php echo esc_attr( $this->set( 'not-found' ) ); ?>">
                <p><?php esc_html_e( 'Nothing Found', 'rees-real-estate-for-woo' ); ?></p>
                <p><?php esc_html_e( 'Sorry, but nothing matched your search terms. Please try again with some different keywords.', 'rees-real-estate-for-woo' ); ?></p>
            </div>
        </div>
		<?php
		return ob_get_clean();
	}

	function input_html( $key ) {
		$input_value = '';
        if ( isset( $_GET['_rees_nonce'], $_GET[ $key ] ) && wp_verify_nonce( sanitize_key( wp_unslash( $_GET['_rees_nonce'] ) ), 'wrealestate_nonce' ) ) {
            $input_value = sanitize_text_field( wp_unslash( $_GET[ $key ] ) );
        }
		$default_lang = 'default';
		$title        = is_array( $this->get_params( $key . '_label' ) ) ? $this->get_params( $key . '_label' )[ $default_lang ] ?? '' : $this->get_params( $key . '_label' );
		$place_holder = is_array( $this->get_params( $key . '_place_holder' ) ) ? $this->get_params( $key . '_place_holder' )[ $default_lang ] ?? '' : $this->get_params( $key . '_place_holder' );
		ob_start();
		?>
        <div class="vi-hui-field" id="<?php echo esc_attr( $this->set( $key ) ); ?>">
            <label for=""><?php echo esc_html( $title ); ?></label>
            <input type="text" placeholder="<?php echo esc_attr( $place_holder ); ?>"
                   name="<?php echo esc_attr( $key ); ?>"
                   value="<?php echo esc_attr( $input_value );?>">
            <span class="woore-real-estate-search-edit-item-shortcut" data-edit_section="input_search"></span>
        </div>
		<?php
		return ob_get_clean();
	}

	function button_search_html( $key ) {
		$text = $this->get_params( $key . '_text' );
		$type = $this->button_type;

		ob_start();
		?>
        <div class="vi-hui-field" id="<?php echo esc_attr( $this->set( $key ) ); ?>">
            <button type="submit" class="vi-hui-button">
				<?php if ( 'icon' === $type || 'icon_text' === $type ) {
					?>
                    <span class="dashicons dashicons-search"></span>
					<?php
				} ?>
				<?php if ( 'text' === $type || 'icon_text' === $type ) {
					?>
                    <span class="<?php echo esc_attr( $this->set( $key . '_text' ) ); ?>"><?php echo esc_html( $text ); ?></span>
					<?php
				} ?>
            </button>
            <span class="woore-real-estate-search-edit-item-shortcut"
                  data-edit_section="<?php echo esc_attr( $key ); ?>"></span>
        </div>
		<?php
		return ob_get_clean();
	}

	function woore_form_search_fields_html( $key, $type ) {
		$min_value = '';
		$max_value = '';
		if ( isset( $_GET['_rees_nonce'], $_GET[ 'min_' . $key ], $_GET[ 'max_' . $key ] ) && wp_verify_nonce( sanitize_key( wp_unslash( $_GET['_rees_nonce'] ) ), 'wrealestate_nonce' ) ) {
			$min_value = sanitize_text_field( wp_unslash( $_GET[ 'min_' . $key ] ) );
			$max_value = sanitize_text_field( wp_unslash( $_GET[ 'max_' . $key ] ) );
		}

		$label           = '';
		$min_placeholder = '';
		$max_placeholder = '';
		switch ( $key ) {
			case 'price_search':
				$label           = esc_html__( 'Price Range:', 'rees-real-estate-for-woo' );
				$min_placeholder = esc_html__( 'Min Price', 'rees-real-estate-for-woo' );
				$max_placeholder = esc_html__( 'Max Price', 'rees-real-estate-for-woo' );
				break;
			case 'size_search':
				$label           = esc_html__( 'Size Range:', 'rees-real-estate-for-woo' );
				$min_placeholder = esc_html__( 'Min Size', 'rees-real-estate-for-woo' );
				$max_placeholder = esc_html__( 'Max Size', 'rees-real-estate-for-woo' );
				break;
			default:
		}

		ob_start();
		if ( 'input' === $type ) { ?>
            <div class="woore_form_search_fields <?php echo esc_attr( $this->set( $key ) ); ?>"
                 id="<?php echo esc_attr( $this->set( $type . '-' . $key ) ); ?>">
                <label for=""><?php echo esc_html( $label ); ?></label>
                <div class="woore_form_search_fields_inputs">
                    <div class="vi-hui-field">
                        <input type="number" placeholder="<?php echo esc_attr( $min_placeholder ); ?>"
                               name="<?php echo esc_attr( 'min_' . $key ); ?>"
                               value="<?php echo esc_attr( $min_value )?>">
                    </div>
                    <div class="vi-hui-field">
                        <input type="number" placeholder="<?php echo esc_attr( $max_placeholder ); ?>"
                               name="<?php echo esc_attr( 'max_' . $key ); ?>"
                               value="<?php echo esc_attr( $max_value )?>">
                    </div>
                </div>
                <span class="woore-real-estate-search-edit-item-shortcut"
                      data-edit_section="<?php echo esc_attr( $key ); ?>"></span>
            </div>
			<?php
		}

		return ob_get_clean();

	}

	function wp_enqueue_scripts() {

		wp_enqueue_style( 'woore-real-estate-search-page-style', REES_CONST_F['css_url'] . 'real-estate-search-page' . $this->suffix . '.css', array(), REES_CONST_F['version'] );

		if ( ! is_customize_preview() ) {
			$css = '';
			if ( ! empty( $this->settings->get_params( 'fields' ) ) ) {
				$css .= $this->add_inline_style( array( 'input_size' ), '.woore-real-estate-search-page #woore_search_form.vi-hui-form input[type=text], .woore-real-estate-search-page #woore_search_form.vi-hui-form input[type=number]', array( 'padding' ), array( 'px' ) );
				$css .= $this->add_inline_style( array( 'button_size' ), '.woore-real-estate-search-page #woore_search_form.vi-hui-form .vi-hui-button', array( 'padding' ), array( 'px' ) );
				$css .= $this->add_inline_style( array( 'label_fields' ), '.woore-real-estate-search-page #woore_search_form.vi-hui-form .vi-hui-field > label', array( 'display' ), array( '' ) );
				$css .= $this->add_inline_style( array( 'label_fields' ), '.woore-real-estate-search-page #woore_search_form.vi-hui-form .woore_form_search_fields > label', array( 'display' ), array( '' ) );
				$css .= $this->add_inline_style( array( 'select2_size' ), '.woore-real-estate-search-page #woore_search_form.vi-hui-form .select2-container .select2-selection--single', array( 'height' ), array( 'px' ) );
				$css .= $this->add_inline_style( array( 'select2_size' ), '.woore-real-estate-search-page #woore_search_form.vi-hui-form .select2-container--default .select2-selection--single .select2-selection__rendered', array( 'line-height' ), array( 'px' ) );
				$css .= $this->add_inline_style( array( 'select2_size' ), '.woore-real-estate-search-page #woore_search_form.vi-hui-form .select2-container--default .select2-selection--single .select2-selection__arrow', array( 'height' ), array( 'px' ) );
				$css .= $this->add_inline_style( array(
					'input_search_col_width_desktop',
					'input_search_hide_on_desktop'
				), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-input_search', array(
					'width',
					'display'
				), array( '%', '' ), 'desktop' );
				$css .= $this->add_inline_style( array(
					'input_search_col_width_tablet',
					'input_search_hide_on_tablet'
				), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-input_search', array(
					'width',
					'display'
				), array( '%', '' ), 'tablet' );
				$css .= $this->add_inline_style( array(
					'input_search_col_width_mobile',
					'input_search_hide_on_tablet'
				), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-input_search', array(
					'width',
					'display'
				), array( '%', '' ), 'mobile' );
				$css .= $this->add_inline_style( array( 'button_search_text_size' ), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-button_search .vi-hui-button .woore-real-estate-search-button_search_text', array( 'font-size' ), array( 'px' ) );
				$css .= $this->add_inline_style( array( 'button_search_icon_size' ), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-button_search .vi-hui-button .dashicons', array( 'font-size' ), array( 'px' ) );
				$css .= $this->add_inline_style( array( 'button_search_color' ), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-button_search .vi-hui-button .dashicons, .woore-real-estate-search-page #woore_search_form #woore-real-estate-search-button_search .vi-hui-button .woore-real-estate-search-button_search_text', array( 'color' ), array( '' ) );
				$css .= $this->add_inline_style( array(
					'button_search_background',
					'button_search_border_width',
					'button_search_border_style',
					'button_search_border_color'
				), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-button_search .vi-hui-button', array(
					'background',
					'border-width',
					'border-style',
					'border-color'
				), array( '', 'px', '', '' ) );
				$css .= $this->add_inline_style( array( 'price_search_col_width_desktop' ), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-input-price_search', array( 'width' ), array( '%' ), 'desktop' );
				$css .= $this->add_inline_style( array( 'price_search_col_width_tablet' ), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-input-price_search', array( 'width' ), array( '%' ), 'tablet' );
				$css .= $this->add_inline_style( array( 'price_search_col_width_mobile' ), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-input-price_search', array( 'width' ), array( '%' ), 'mobile' );
				$css .= $this->add_inline_style( array( 'price_search_hide_on_desktop' ), '.woore-real-estate-search-page #woore_search_form .woore-real-estate-search-price_search', array( 'display' ), array( '' ), 'desktop' );
				$css .= $this->add_inline_style( array( 'price_search_hide_on_tablet' ), '.woore-real-estate-search-page #woore_search_form .woore-real-estate-search-price_search', array( 'display' ), array( '' ), 'tablet' );
				$css .= $this->add_inline_style( array( 'price_search_hide_on_mobile' ), '.woore-real-estate-search-page #woore_search_form .woore-real-estate-search-price_search', array( 'display' ), array( '' ), 'mobile' );
				$css .= $this->add_inline_style( array( 'size_search_col_width_desktop' ), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-input-size_search', array( 'width' ), array( '%' ), 'desktop' );
				$css .= $this->add_inline_style( array( 'size_search_col_width_tablet' ), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-input-size_search', array( 'width' ), array( '%' ), 'tablet' );
				$css .= $this->add_inline_style( array( 'size_search_col_width_mobile' ), '.woore-real-estate-search-page #woore_search_form #woore-real-estate-search-input-size_search', array( 'width' ), array( '%' ), 'mobile' );
				$css .= $this->add_inline_style( array( 'size_search_hide_on_desktop' ), '.woore-real-estate-search-page #woore_search_form .woore-real-estate-search-size_search', array( 'display' ), array( '' ), 'desktop' );
				$css .= $this->add_inline_style( array( 'size_search_hide_on_tablet' ), '.woore-real-estate-search-page #woore_search_form .woore-real-estate-search-size_search', array( 'display' ), array( '' ), 'tablet' );
				$css .= $this->add_inline_style( array( 'size_search_hide_on_mobile' ), '.woore-real-estate-search-page #woore_search_form .woore-real-estate-search-size_search', array( 'display' ), array( '' ), 'mobile' );
			}

			wp_add_inline_style( 'woore-real-estate-search-page-style', $css );
		}
	}


	private function add_inline_style( $name, $element, $style, $suffix = '', $media = '', $echo = false ) {

		$media_start = '';
		$media_end   = empty( $media ) ? '' : '}';
		switch ( $media ) {
			case 'mobile':
				$media_start = '@media screen and (max-width: 320px) {';
				break;
			case 'tablet':
				$media_start = '@media screen and (min-width: 321px) and (max-width: 720px) {';
				break;
			case 'desktop':
				$media_start = '@media screen and (min-width: 721px) {';
				break;
			default:
		}

		$return = $media_start . $element . '{';
		if ( is_array( $name ) && count( $name ) ) {
			foreach ( $name as $key => $value ) {
				$result    = explode( '_', $this->get_params( $value ) );
				$css_value = '';
				if ( count( $result ) > 1 && is_array( $result ) ) {
					foreach ( $result as $item ) {
						$css_value .= ' ' . $item . $suffix[ $key ];
					}
				} else {
					switch ( $this->get_params( $value ) ) {
						case '':
							$css_value = 'none';
							break;
						case 'auto':
							$css_value = 'auto';
							break;
						default:
							$css_value = $this->get_params( $value ) . $suffix[ $key ];
					}
				}
				$return .= $style[ $key ] . ':' . $css_value . ';';
			}
		}
		$return .= '}' . $media_end;
		if ( $echo ) {
			echo wp_kses_post( $return );
		}

		return $return;
	}

	public function wp_footer() {
		if ( $this->is_search_result_page() ) {
			?>
            <div class="<?php echo esc_attr( $this->set( 'preview-processing-overlay' ) ) ?>"></div>
			<?php
		}
	}

	public function is_search_result_page() {
		$search_result_page = $this->get_params( 'search_result_page' );
		$return             = false;
		if ( $search_result_page ) {
			$return = is_page( $search_result_page );
		}

		return $return;
	}

	private function set( $name ) {
		return woore_set_prefix( $this->prefix, $name );
	}

	private function get_params( $name = '' ) {
		return $this->settings->get_params( $name );
	}
}