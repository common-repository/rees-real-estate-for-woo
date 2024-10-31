<?php defined( 'ABSPATH' ) || exit; ?>

<div class="woore-single-property-area">

    <p class="woore-single-property-area-header"><?php esc_html_e( 'feature', 'rees-real-estate-for-woo' ); ?></p>

    <div class="woore-feature">

        <div class="woore-feature-wrap">
            <div class="woore-feature-group">
                <?php foreach ( $property_feature as $feature ) : ?>
                <?php $attribute_link = get_term_link( $feature->slug, $feature->taxonomy ); ?>
                    <a href="<?php echo esc_url( $attribute_link ); ?>" class="woore-feature-item">
                        <i class="icon icon-woore-round-check"></i>
                        <span><?php echo esc_html( $feature->name ) ?></span>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

</div>