<?php

namespace REES\Inc\Customizer;

defined( 'ABSPATH' ) || exit;

class REES_Customizer_Control_Toggle_Checkbox extends \WP_Customize_Control {
	public $type = 'rees-toggle-checkbox';
	protected $suffix = WP_DEBUG ? '' : '.min';

	public function render_content() {
		?>
        <div class="<?php echo esc_attr( $this->set( 'toggle-checkbox-container' ) ); ?>"
             data-id="<?php echo esc_attr( $this->id ); ?>"
             data-choices="<?php echo esc_attr( wp_json_encode( $this->choices ) ); ?>">
            <label for="<?php echo esc_attr( $this->set( $this->id ) ); ?>">
				<?php
				if ( ! empty( $this->label ) ) {
					?>
                    <span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
					<?php
				}
				?>
            </label>
            <label for="<?php echo esc_attr( $this->set( $this->id ) ); ?>"
                   class="<?php echo esc_attr( $this->set( 'toggle-checkbox' ) ); ?>">
                <input type="checkbox" name="<?php echo esc_attr( $this->set( $this->id ) ); ?>"
                       id="<?php echo esc_attr( $this->set( $this->id ) ); ?>" <?php checked( ! empty( $this->choices[ $this->value() ] ) ) ?>>
                <span></span>
            </label>
        </div>
		<?php
	}

	private function set( $name ) {
		return woore_set_prefix( 'woore-real-estate-search-', $name );
	}

	public function enqueue() {
		wp_enqueue_style( 'woore-custom-controls-toggle-checkbox-style', REES_CONST_F['css_url'] . 'custom-controls-toggle-checkbox' . $this->suffix . '.css', array(), REES_CONST_F['version'] );
	}
}