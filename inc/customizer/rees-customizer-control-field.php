<?php

namespace REES\Inc\Customizer;
defined( 'ABSPATH' ) || exit;

class REES_Customizer_Control_Field extends \WP_Customize_Control {
	public $type = 'rees-field';
	public $fields_default;

	protected $suffix = WP_DEBUG ? '' : '.min';

	function render_content() {
		?>
        <div class="customize-control-content">
			<?php
			if ( ! empty( $this->label ) ) {
				?>
                <span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
				<?php
			}

			?>
        </div>
		<?php
		$forms = json_decode( $this->value(), true );

		$fields_default = $this->fields_default;

		?>
        <div class="<?php echo esc_attr( $this->set( 'container' ) ); ?>">

			<?php if ( is_array( $forms ) && count( $forms ) ) : ?>
                <div id="<?php echo esc_attr( $this->set( 'container-banner-search' ) ); ?>">
                    <span><?php esc_html_e( 'Basic Search', 'rees-real-estate-for-woo' ); ?></span>

					<?php if ( isset( $forms['banner_search'] ) && ! empty( $forms['banner_search'] ) ) : ?>
						<?php foreach ( $forms['banner_search'] as $field ) : ?>
							<?php if ( isset( $fields_default[ $field[0] ] ) ) : ?>
                            <div class="<?php echo esc_attr( $this->set( array( 'item' ) ) ); ?> <?php echo ! empty( $field[1] ) ? esc_attr( $this->set( 'item__active' ) ) : ''; ?>"
                                 data-block_item="<?php echo esc_attr( $field[0] ); ?>">
								<?php echo esc_html( $fields_default[ $field[0] ] ); ?>
                                <span class="dashicons-edit dashicons" title="<?php esc_html_e( 'Edit Component', 'rees-real-estate-for-woo' ); ?>"></span>
                                <span class="dashicons-visibility dashicons" title="<?php esc_html_e( 'Show Component', 'rees-real-estate-for-woo' ); ?>"></span>
                                <span class="dashicons-hidden dashicons" title="<?php esc_html_e( 'Hide Component', 'rees-real-estate-for-woo' ); ?>"></span>
                            </div>
                            <?php endif; ?>
						<?php endforeach; ?>
					<?php endif; ?>
                </div>
			<?php endif; ?>
        </div>
		<?php
	}

	private function set( $name ) {
		return woore_set_prefix( 'woore-real-estate-search-', $name );
	}

	function enqueue() {
		wp_enqueue_script( 'woore-custom-controls-fields-js', REES_CONST_F['js_url'] . 'custom-controls-fields' . $this->suffix . '.js', array(
			'jquery',
			'jquery-ui-sortable'
		), REES_CONST_F['version'], true );
		wp_enqueue_style( 'woore-custom-controls-fields-css', REES_CONST_F['css_url'] . 'custom-controls-fields' .$this->suffix . '.css', '', REES_CONST_F['version'] );
	}
}