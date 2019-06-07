const { registerBlockType } = wp.blocks;

const { __ } = wp.i18n;

const { RangeControl, Spinner, Button, ToggleControl, Tooltip, Placeholder, Toolbar, PanelBody } = wp.components;

const { InspectorControls, BlockControls } = wp.editor;

import MetadataModal from './metadata-modal.js';
import tainacan from '../../api-client/axios.js';
import axios from 'axios';
import qs from 'qs';

registerBlockType('tainacan/facets-list', {
    title: __('Tainacan Facets List', 'tainacan'),
    icon:
        <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
                height="24px"
                width="24px">
            <path 
                    fill="#298596"
                    d="M21.43,13.64,19.32,16a2.57,2.57,0,0,1-2,1H11a3.91,3.91,0,0,0,0-.49,5.49,5.49,0,0,0-5-5.47V9.64A2.59,2.59,0,0,1,8.59,7H17.3a2.57,2.57,0,0,1,2,1l2.11,2.38A2.59,2.59,0,0,1,21.43,13.64ZM4,3A2,2,0,0,0,2,5v7.3a5.32,5.32,0,0,1,2-1V5H16V3ZM11,21l-1,1L8.86,20.89,8,20H8l-.57-.57A3.42,3.42,0,0,1,5.5,20a3.5,3.5,0,0,1,0-7,2.74,2.74,0,0,1,.5,0A3.5,3.5,0,0,1,9,16a2.92,2.92,0,0,1,0,.51,3.42,3.42,0,0,1-.58,1.92L9,19H9l.85.85Zm-4-4.5A1.5,1.5,0,1,0,5.5,18,1.5,1.5,0,0,0,7,16.53Z"/>
        </svg>,
    category: 'tainacan-blocks',
    keywords: [ __( 'facets', 'tainacan' ), __( 'search', 'tainacan' ), __( 'terms', 'tainacan' ) ],
    attributes: {
        content: {
            type: 'array',
            source: 'children',
            selector: 'div'
        },
        collectionId: {
            type: String,
            default: undefined
        },
        collectionSlug: {
            type: String,
            default: undefined
        },
        facets: {
            type: Array,
            default: []
        },
        facetsObject: {
            type: Array,
            default: []
        },
        showImage: {
            type: Boolean,
            default: true
        },
        showItemsCount: {
            type: Boolean,
            default: true
        },
        layout: {
            type: String,
            default: 'grid'
        },
        cloudRate: {
            type: Number,
            default: 1
        },
        isModalOpen: {
            type: Boolean,
            default: false
        },
        gridMargin: {
            type: Number,
            default: 0
        },
        metadatumId: {
            type: String,
            default: undefined
        },
        metadatumType: {
            type: String,
            default: undefined
        },
        facetsRequestSource: {
            type: String,
            default: undefined
        },
        maxFacetsNumber: {
            type: Number,
            value: undefined
        },
        isLoading: {
            type: Boolean,
            value: false
        },
        isLoadingCollection: {
            type: Boolean,
            value: false
        },
        showSearchBar: {
            type: Boolean,
            value: false
        },
        collection: {
            type: Object,
            value: undefined
        },
        searchString: {
            type: String,
            default: undefined
        },
        blockId: {
            type: String,
            default: undefined
        },
    },
    supports: {
        align: ['full', 'wide'],
        html: false,
    },
    edit({ attributes, setAttributes, className, isSelected, clientId }){
        let {
            facets, 
            facetsObject,
            content, 
            collectionId,
            collectionSlug,    
            showImage,
            showItemsCount,
            layout,
            cloudRate,
            isModalOpen,
            gridMargin,
            metadatumId,
            metadatumType,
            facetsRequestSource,
            maxFacetsNumber,
            searchString,
            isLoading,
            showSearchBar
        } = attributes;

        // Obtains block's client id to render it on save function
        setAttributes({ blockId: clientId });
    
        function prepareFacet(facet) {
            return (
                <li 
                    key={ facet.id }
                    className="facet-list-item"
                    style={{ marginBottom: layout == 'grid' ? gridMargin + 'px' : ''}}>      
                    <a 
                        id={ isNaN(facet.id) ? facet.id : 'facet-id-' + facet.id }
                        href={ facet.url } 
                        target="_blank"
                        className={ (!showImage ? 'facet-without-image' : '') }
                        style={{ fontSize: layout == 'cloud' && facet.total_items ? + (1 + (cloudRate/4) * Math.log(facet.total_items)) + 'rem' : ''}}>
                        { (metadatumType == 'Taxonomy' || metadatumType == 'Relationship') ? 
                            <img
                                src={ 
                                    facet.thumbnail && facet.thumbnail['tainacan-medium'][0] && facet.thumbnail['tainacan-medium'][0] 
                                        ?
                                    facet.thumbnail['tainacan-medium'][0] 
                                        :
                                    (facet.thumbnail && facet.thumbnail['thumbnail'][0] && facet.thumbnail['thumbnail'][0]
                                        ?    
                                    facet.thumbnail['thumbnail'][0] 
                                        : 
                                    `${tainacan_plugin.base_url}/admin/images/placeholder_square.png`)
                                }
                                alt={ facet.label ? facet.label : __( 'Thumbnail', 'tainacan' ) }/>
                        : null 
                        }
                        <span>{ facet.label ? facet.label : '' }</span>
                        { facet.total_items ? <span class="facet-item-count" style={{ display: !showItemsCount ? 'none' : '' }}>&nbsp;({ facet.total_items })</span> : null }
                    </a>
                </li>
            );
        }

        function setContent(){

            facets = [];
            isLoading = true;
            
            if (facetsRequestSource != undefined && typeof facetsRequestSource == 'function')
                facetsRequestSource.cancel('Previous facets search canceled.');

            facetsRequestSource = axios.CancelToken.source();
            
            setAttributes({
                isLoading: isLoading
            });
            
            let endpoint = collectionId != 'default' ? '/collection/' + collectionId + '/facets/' + metadatumId : '/facets/' + metadatumId;
            let query = endpoint.split('?')[1];
            let queryObject = qs.parse(query);

            // Set up max facets to be shown
            if (maxFacetsNumber != undefined && maxFacetsNumber > 0)
                queryObject.number = maxFacetsNumber;
            else if (queryObject.number != undefined && queryObject.number > 0)
                setAttributes({ maxFacetsNumber: queryObject.number });
            else {
                queryObject.number = 12;
                setAttributes({ maxFacetsNumber: 12 });
            }

            // Set up searching string
            if (searchString != undefined)
                queryObject.search = searchString;
            else if (queryObject.search != undefined)
                setAttributes({ searchString: queryObject.search });
            else {
                delete queryObject.search;
                setAttributes({ searchString: undefined });
            }
            
            endpoint = endpoint.split('?')[0] + '?' + qs.stringify(queryObject);
            
            tainacan.get(endpoint, { cancelToken: facetsRequestSource.token })
                .then(response => {
                    facetsObject = [];

                    for (let facet of response.data.values) {
                        facetsObject.push(Object.assign({ 
                            url: tainacan_plugin.site_url + '/' + collectionSlug + '/#/?metaquery[0][key]=' + metadatumId + '&metaquery[0][value]=' + facet.value
                        }, facet));
                    }
                    
                    for (let facet of facetsObject)
                        facets.push(prepareFacet(facet));

                    setAttributes({
                        content: <div></div>,
                        facets: facets,
                        facetsObject: facetsObject,
                        isLoading: false,
                        facetsRequestSource: facetsRequestSource
                    });
                });
        }

        function updateContent() {
            facets = [];
            for (let facet of facetsObject)
                facets.push(prepareFacet(facet));

            setAttributes({
                content: <div></div>,
                facets: facets
            });
        }

        function openMetadataModal() {
            isModalOpen = true;
            setAttributes( { 
                isModalOpen: isModalOpen
            } );
        }

        function updateLayout(newLayout) {
            layout = newLayout;

            if (layout == 'grid')
                showImage = true;

            
            if (layout == 'cloud')
                showImage = false;

            setAttributes({ 
                layout: layout, 
                showImage: showImage
            });
            updateContent();
        }

        function applySearchString(event) {

            let value = event.target.value;

            if (searchString != value) {
                searchString = value;
                setAttributes({ searchString: searchString });
                setContent();
            }
        }

        // Executed only on the first load of page
        if(content && content.length && content[0].type)
            setContent();

        const layoutControls = [
            {
                icon: 'grid-view',
                title: __( 'Grid View' ),
                onClick: () => updateLayout('grid'),
                isActive: layout === 'grid',
            },
            {
                icon: 'list-view',
                title: __( 'List View' ),
                onClick: () => updateLayout('list'),
                isActive: layout === 'list',
            },
            {
                icon: 'cloud',
                title: __( 'Cloud View' ),
                onClick: () => updateLayout('cloud'),
                isActive: layout === 'cloud',
            }
        ];

        return (
            <div className={className}>

                <div>
                    <BlockControls>
                        <Toolbar controls={ layoutControls } />
                    </BlockControls>
                </div>

                <div>
                    <InspectorControls>
                        
                        <PanelBody
                                title={__('Search bar', 'tainacan')}
                                initialOpen={ true }
                            >
                            <ToggleControl
                                label={__('Display bar', 'tainacan')}
                                help={ showSearchBar ? __('Toggle to show search bar on block', 'tainacan') : __('Do not show search bar', 'tainacan')}
                                checked={ showSearchBar }
                                onChange={ ( isChecked ) => {
                                        showSearchBar = isChecked;
                                        setAttributes({ showSearchBar: showSearchBar });
                                    } 
                                }
                            />
                        </PanelBody>
                        <PanelBody
                                title={__('Facets', 'tainacan')}
                                initialOpen={ true }
                            >
                            <div>
                                <RangeControl
                                    label={__('Maximum number of facets', 'tainacan')}
                                    value={ maxFacetsNumber }
                                    onChange={ ( aMaxFacetsNumber ) => {
                                        maxFacetsNumber = aMaxFacetsNumber;
                                        setAttributes( { maxFacetsNumber: aMaxFacetsNumber } ) 
                                        setContent();
                                    }}
                                    min={ 1 }
                                    max={ 96 }
                                />
                            </div>
                            <hr></hr>
                            <div>
                                { layout == 'list' && (metadatumType == 'Taxonomy' || metadatumType == 'Relationship') ? 
                                    <ToggleControl
                                        label={__('Image', 'tainacan')}
                                        help={ showImage ? __("Toggle to show facet's image", 'tainacan') : __("Do not show facet's image", 'tainacan')}
                                        checked={ showImage }
                                        onChange={ ( isChecked ) => {
                                                showImage = isChecked;
                                                setAttributes({ showImage: showImage });
                                                updateContent();
                                            } 
                                        }
                                    /> 
                                : null }
                                { layout == 'grid' ?
                                    <div>
                                        { (metadatumType == 'Taxonomy' || metadatumType == 'Relationship') ? 
                                            <ToggleControl
                                                label={__('Image', 'tainacan')}
                                                help={ showImage ? __("Toggle to show facet's image", 'tainacan') : __("Do not show facet's image", 'tainacan')}
                                                checked={ showImage }
                                                onChange={ ( isChecked ) => {
                                                        showImage = isChecked;
                                                        setAttributes({ showImage: showImage });
                                                        updateContent();
                                                    } 
                                                }
                                            /> : null
                                        }
                                        <div style={{ marginTop: '16px'}}>
                                            <RangeControl
                                                label={__('Margin between facets in pixels', 'tainacan')}
                                                value={ gridMargin }
                                                onChange={ ( margin ) => {
                                                    gridMargin = margin;
                                                    setAttributes( { gridMargin: margin } ) 
                                                    updateContent();
                                                }}
                                                min={ 0 }
                                                max={ 48 }
                                            />
                                        </div>
                                    </div>
                                : null }
                                <ToggleControl
                                        label={__('Items count', 'tainacan')}
                                        help={ showItemsCount ? __("Toggle to show items counter", 'tainacan') : __("Do not show items counter", 'tainacan')}
                                        checked={ showItemsCount }
                                        onChange={ ( isChecked ) => {
                                                showItemsCount = isChecked;
                                                setAttributes({ showItemsCount: showItemsCount });
                                                updateContent();
                                            } 
                                        }
                                    /> 
                            </div>
                        </PanelBody>
                        { layout == 'cloud' ? 
                            <PanelBody
                                    title={__('Cloud settings', 'tainacan')}
                                    initialOpen={ true }
                                >
                                <div>
                                    <RangeControl
                                            label={__('Growth rate for facets according to items count.', 'tainacan')}
                                            value={ cloudRate }
                                            onChange={ ( rate ) => {
                                                cloudRate = rate;
                                                setAttributes( { cloudRate: rate } ) 
                                                updateContent();
                                            }}
                                            min={ 0 }
                                            max={ 10 }
                                        />
                                </div>
                            </PanelBody>
                        : null 
                        }
                    </InspectorControls>
                </div>

                { isSelected ? 
                    (
                    <div>
                        { isModalOpen ? 
                            <MetadataModal
                                existingCollectionId={ collectionId } 
                                existingCollectionSlug={ collectionSlug } 
                                existingMetadatumId={ metadatumId } 
                                existingMetadatumType={ metadatumType } 
                                onSelectCollection={ (selectedCollection) => {
                                    collectionId = selectedCollection.id;
                                    collectionSlug = selectedCollection.slug;

                                    setAttributes({ 
                                        collectionSlug: collectionSlug,
                                        collectionId: collectionId 
                                    });
                                }}
                                onSelectMetadatum={ (selectedFacet) =>{
                                    metadatumId = selectedFacet.metadatumId;
                                    metadatumType = selectedFacet.metadatumType;
                                    setAttributes({
                                        metadatumId: metadatumId,
                                        metadatumType: metadatumType,
                                        isModalOpen: false
                                    });
                                    setContent();
                                }}
                                onCancelSelection={ () => setAttributes({ isModalOpen: false }) }/> 
                            : null
                        }
                        
                        { facets.length ? (
                            <div className="block-control">
                                <p>
                                    <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            viewBox="0 0 24 24"
                                            height="24px"
                                            width="24px">
                                        <path 
                                                fill="#298596"
                                                d="M21.43,13.64,19.32,16a2.57,2.57,0,0,1-2,1H11a3.91,3.91,0,0,0,0-.49,5.49,5.49,0,0,0-5-5.47V9.64A2.59,2.59,0,0,1,8.59,7H17.3a2.57,2.57,0,0,1,2,1l2.11,2.38A2.59,2.59,0,0,1,21.43,13.64ZM4,3A2,2,0,0,0,2,5v7.3a5.32,5.32,0,0,1,2-1V5H16V3ZM11,21l-1,1L8.86,20.89,8,20H8l-.57-.57A3.42,3.42,0,0,1,5.5,20a3.5,3.5,0,0,1,0-7,2.74,2.74,0,0,1,.5,0A3.5,3.5,0,0,1,9,16a2.92,2.92,0,0,1,0,.51,3.42,3.42,0,0,1-.58,1.92L9,19H9l.85.85Zm-4-4.5A1.5,1.5,0,1,0,5.5,18,1.5,1.5,0,0,0,7,16.53Z"/>
                                    </svg>
                                    {__('List facets from a Tainacan Collection or Repository', 'tainacan')}
                                </p>
                                <Button
                                    isPrimary
                                    type="submit"
                                    onClick={ () => openMetadataModal() }>
                                    {__('Configure search', 'tainacan')}
                                </Button>    
                            </div>
                            ): null
                        }
                    </div>
                    ) : null
                }

                {
                    showSearchBar ?
                    <div class="facets-search-bar">
                        <Button
                            onClick={ () => {  setContent(); }}
                            label={__('Search', 'tainacan')}>
                            <span class="icon">
                                <i>
                                    <svg width="24" height="24" viewBox="-2 -4 20 20">
                                    <path class="st0" d="M0,5.8C0,5,0.2,4.2,0.5,3.5s0.7-1.3,1.2-1.8s1.1-0.9,1.8-1.2C4.2,0.1,5,0,5.8,0S7.3,0.1,8,0.5
                                        c0.7,0.3,1.3,0.7,1.8,1.2s0.9,1.1,1.2,1.8c0.5,1.2,0.5,2.5,0.2,3.7c0,0.2-0.1,0.4-0.2,0.6c0,0.1-0.2,0.6-0.2,0.6
                                        c0.6,0.6,1.3,1.3,1.9,1.9c0.7,0.7,1.3,1.3,2,2c0,0,0.3,0.2,0.3,0.3c0,0.3-0.1,0.7-0.3,1c-0.2,0.6-0.8,1-1.4,1.2
                                        c-0.1,0-0.6,0.2-0.6,0.1c0,0-4.2-4.2-4.2-4.2c0,0-0.8,0.3-0.8,0.4c-1.3,0.4-2.8,0.5-4.1-0.1c-0.7-0.3-1.3-0.7-1.8-1.2
                                        C1.2,9.3,0.8,8.7,0.5,8S0,6.6,0,5.8z M1.6,5.8c0,0.4,0.1,0.9,0.2,1.3C2.1,8.2,3,9.2,4.1,9.6c0.5,0.2,1,0.3,1.6,0.3
                                        c0.6,0,1.1-0.1,1.6-0.3C8.7,9,9.7,7.6,9.8,6c0.1-1.5-0.6-3.1-2-3.9c-0.9-0.5-2-0.6-3-0.4C4.6,1.8,4.4,1.9,4.1,2
                                        c-0.5,0.2-1,0.5-1.4,0.9C2,3.7,1.6,4.7,1.6,5.8z"/>       
                                    </svg>
                                </i>
                            </span>
                        </Button>
                        <input
                                value={ searchString }
                                onChange={ (value) =>  { _.debounce(applySearchString(value), 300); } }
                                type="text"/>
                        <Tooltip text={__('If necessary, pagination will be available on post or page.', 'tainacan')}>
                            <button
                                    class="previous-button"
                                    disabled
                                    label={__('Previous page', 'tainacan')}>
                                <span class="icon">
                                    <i>
                                        <svg
                                                width="30"
                                                height="30"
                                                viewBox="0 2 20 20">
                                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                                            <path
                                                    d="M0 0h24v24H0z"
                                                    fill="none"/>                        
                                        </svg>
                                    </i>
                                </span>
                            </button>
                        </Tooltip> 
                        <Tooltip text={__('If necessary, pagination will be available on post or page.', 'tainacan')}>
                            <button
                                    class="next-button"
                                    disabled
                                    label={__('Next page', 'tainacan')}>
                                <span class="icon">
                                    <i>
                                        <svg
                                                width="30"
                                                height="30"
                                                viewBox="0 2 20 20">
                                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                                            <path
                                                    d="M0 0h24v24H0z"
                                                    fill="none"/>                        
                                        </svg>
                                    </i>
                                </span>
                            </button>   
                        </Tooltip>
                    </div>
                : null
                }

                { !facets.length && !isLoading && !(searchString != undefined && searchString != '') ? (
                    <Placeholder
                        icon={(
                            <img
                                width={148}
                                src={ `${tainacan_plugin.base_url}/admin/images/tainacan_logo_header.svg` }
                                alt="Tainacan Logo"/>
                        )}>
                        <p>
                            <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24"
                                    height="24px"
                                    width="24px">
                                <path 
                                        fill="#298596"
                                        d="M21.43,13.64,19.32,16a2.57,2.57,0,0,1-2,1H11a3.91,3.91,0,0,0,0-.49,5.49,5.49,0,0,0-5-5.47V9.64A2.59,2.59,0,0,1,8.59,7H17.3a2.57,2.57,0,0,1,2,1l2.11,2.38A2.59,2.59,0,0,1,21.43,13.64ZM4,3A2,2,0,0,0,2,5v7.3a5.32,5.32,0,0,1,2-1V5H16V3ZM11,21l-1,1L8.86,20.89,8,20H8l-.57-.57A3.42,3.42,0,0,1,5.5,20a3.5,3.5,0,0,1,0-7,2.74,2.74,0,0,1,.5,0A3.5,3.5,0,0,1,9,16a2.92,2.92,0,0,1,0,.51,3.42,3.42,0,0,1-.58,1.92L9,19H9l.85.85Zm-4-4.5A1.5,1.5,0,1,0,5.5,18,1.5,1.5,0,0,0,7,16.53Z"/>
                            </svg>
                            {__('List facets from a Tainacan Collection or Repository', 'tainacan')}
                        </p>
                        <Button
                            isPrimary
                            type="submit"
                            onClick={ () => openMetadataModal() }>
                            {__('Select facets', 'tainacan')}
                        </Button>   
                    </Placeholder>
                    ) : null
                }
                
                { isLoading ? 
                    <div class="spinner-container">
                        <Spinner />
                    </div> :
                    <div>
                        <ul 
                            style={{ 
                                gridTemplateColumns: layout == 'grid' ? 'repeat(auto-fill, ' +  (gridMargin + 185) + 'px)' : 'inherit', 
                                marginTop: showSearchBar ? '1.5rem' : '0px'
                            }}
                            className={'facets-list-edit facets-layout-' + layout }>
                            { facets }
                        </ul>
                    </div>
                }
            </div>
        );
    },
    save({ attributes, className }){
        const {
            content, 
            blockId,
            collectionId,  
            collectionSlug,  
            showImage,
            showItemsCount,
            layout,
            gridMargin,
            metadatumId,
            metadatumType,
            maxFacetsNumber,
            showSearchBar,
        } = attributes;
        
        return <div 
                    className={ className }
                    metadatum-id={ metadatumId }
                    metadatum-type={ metadatumType }
                    collection-id={ collectionId }  
                    collection-slug={ collectionSlug }  
                    show-image={ '' + showImage }
                    show-items-count={ '' + showItemsCount }
                    show-search-bar={ '' + showSearchBar }
                    layout={ layout }
                    grid-margin={ gridMargin }
                    max-facets-number={ maxFacetsNumber }
                    tainacan-api-root={ tainacan_plugin.root }
                    tainacan-base-url={ tainacan_plugin.base_url }
                    id={ 'wp-block-tainacan-facets-list_' + blockId }>
                        { content }
                </div>
    }
});