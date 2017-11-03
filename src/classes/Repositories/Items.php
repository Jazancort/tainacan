<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}



class TainacanItems {
    
    function __construct() {
        add_action('init', array(&$this, 'register_post_types'));
    }
    
    function register_post_types() {
        
        global $TainacanCollections;
        
        $collections = $TainacanCollections->get_collections();
        
        $labels = array(
            'name' => 'Item',
            'singular_name' => 'Item',
            'add_new' => 'Adicionar Novo',
            'add_new_item' =>'Adicionar Item',
            'edit_item' => 'Editar',
            'new_item' => 'Novo Item',
            'view_item' => 'Visualizar',
            'search_items' => 'Pesquisar',
            'not_found' => 'Nenhum Item encontrado',
            'not_found_in_trash' => 'Nenhum Item encontrado na lixeira',
            'parent_item_colon' => 'Item acima:',
            'menu_name' => 'Item'
        );
        
        if (!is_array($collections))
            return;
            
        foreach ($collections as $collection) {
            
            $labels['menu_name'] = $collection->get_name();
            $cpt_slug = $TainacanCollections->get_collection_db_identifier($collection->get_id());
            
            $args = array(
                'labels' => $labels,
                'hierarchical' => true,
                //'supports' => array('title'),
                //'taxonomies' => array(self::TAXONOMY),
                'public' => true,
                'show_ui' => tnc_enable_dev_wp_interface(),
                'show_in_menu' => tnc_enable_dev_wp_interface(),
                //'menu_position' => 5,
                //'show_in_nav_menus' => false,
                'publicly_queryable' => true,
                'exclude_from_search' => true,
                'has_archive' => true,
                'query_var' => true,
                'can_export' => true,
                'rewrite' => true,
                'capability_type' => 'post',
            );
            register_post_type($cpt_slug, $args);
        }
        
        
        
    }
    
    /*
    function insert(TainacanItem $item) {
        // First iterate through the native post properties
        $map = $item->map_properties();
        foreach ($map as $prop => $mapped) {
            if ($mapped != 'meta') {
                $item->WP_Post->$mapped = $item->get_mapped_property($prop);
            }
        }
        
        // save post and geet its ID
        $item->WP_Post->post_type = self::POST_TYPE;
        $id = wp_insert_post($item->WP_Post);
        
        // Now run through properties stored as postmeta
        foreach ($map as $prop => $mapped) {
            if ($mapped == 'meta') {
                update_post_meta($id, $prop, $item->get_mapped_property($prop));
            }
        }
        
        return $id;
    }
    */
   
    function getItemById($id) {
        return new TainacanItem($id);
    }
    
}

global $TainacanItems;
$TainacanItems = new TainacanItems();