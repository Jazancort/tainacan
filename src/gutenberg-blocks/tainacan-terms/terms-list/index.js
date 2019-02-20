const { registerBlockType } = wp.blocks;

const { __ } = wp.i18n;

const { IconButton, Spinner, ToggleControl, Placeholder, Toolbar } = wp.components;

const { InspectorControls, BlockControls } = wp.editor;

import Autocomplete from 'react-autocomplete';

import tainacan from '../../api-client/axios.js';
import qs from 'qs';

registerBlockType('tainacan/terms-list', {
    title: __('Tainacan Terms List', 'tainacan'),
    icon: 'list-view',
    category: 'tainacan-blocks',
    keywords: [ __( 'Tainacan', 'tainacan' ), __( 'terms', 'tainacan' ), __( 'taxonomy', 'tainacan' ) ],
    attributes: {
        selectedTermsObject: {
            type: 'array',
            source: 'query',
            selector: 'a',
            query: {
                id: {
                    type: 'string',
                    source: 'attribute',
                    attribute: 'id'
                },
                url: {
                    type: 'string',
                    source: 'attribute',
                    attribute: 'href'
                },
                name: {
                    type: 'string',
                    source: 'text'
                },
                header_image: {
                    source: 'query',
                    selector: 'img',
                    query: {
                        src: {
                            source: 'attribute',
                            attribute: 'src'
                        },
                        alt: {
                            source: 'attribute',
                            attribute: 'alt'
                        },
                    }
                }, 
            },
            default: []
        },
        content: {
            type: 'array',
            source: 'children',
            selector: 'div'
        },
        termsPerPage: {
            type: Number,
            default: 12
        },
        query: {
            type: Object,
            default: {}
        },
        taxonomyId: {
            type: String,
            default: ''
        },
        taxonomyName: {
            type: String,
            default: ''
        },
        isLoadingTaxonomies: {
            type: Boolean,
            default: false
        },
        isLoadingTerms: {
            type: Boolean,
            default: false
        },
        taxonomies: {
            type: Array,
            default: []
        },
        terms: {
            type: Array,
            default: []
        },
        selectedTermsHTML: {
            type: Array,
            default: []
        },
        currentTermName: {
            type: String,
            default: ''
        },
        showImage: {
            type: Boolean,
            default: true
        },
        layout: {
            type: String,
            default: 'grid'
        },
    },
    supports: {
        align: ['full', 'left', 'right', 'wide'],
        html: false,
    },
    edit({ attributes, setAttributes, className, isSelected }){
        let { 
            selectedTermsObject, 
            selectedTermsHTML, 
            terms, 
            content, 
            currentTermName, 
            taxonomyId, 
            taxonomyName, 
            isLoadingTerms, 
            isLoadingTaxonomies, 
            taxonomies, 
            showImage,
            layout 
        } = attributes;
        
        console.log("Editando...");
        // console.log(selectedTerms);
        // console.log(selectedTerms);
        // console.log(content);

        function prepareTerm(term) {
            return (
                <li 
                    key={ term.id }
                    className="term-list-item">
                    <IconButton
                        onClick={ () => removeTermOfId(term.id) }
                        icon="no-alt"
                        label={__('Remove', 'tainacan')}/>         
                    <a 
                        id={ isNaN(term.id) ? term.id : 'term-id-' + term.id }
                        href={ term.url } 
                        target="_blank">
                        { term.header_image && showImage ?
                        <img
                            src={ term.header_image && term.header_image[0] && term.header_image[0].src ? term.header_image[0].src : `${tainacan_plugin.base_url}/admin/images/placeholder_square.png`}
                            alt={ term.header_image && term.header_image[0] ? term.header_image[0].alt : term.name }/>
                        : null
                        }
                        { term.name ? term.name : '' }
                    </a>
                </li>
            );
        }

        function setContent(){

            let currentSelectedTermsHTML = [];

            for (let i = 0; i < selectedTermsObject.length; i++)
                currentSelectedTermsHTML.push(prepareTerm(selectedTermsObject[i]));

            selectedTermsHTML = currentSelectedTermsHTML;

            setAttributes({
                selectedTermsHTML: currentSelectedTermsHTML,
                content: (
                    <ul className={'terms-list  terms-layout-' + layout}>{ currentSelectedTermsHTML }</ul>
                )
            });
        }

        function fetchTaxonomies(name) {
            isLoadingTaxonomies = true;
            taxonomies = [];
            terms = []

            setAttributes({ 
                isLoadingTaxonomies: isLoadingTaxonomies, 
                taxonomies: taxonomies,
                terms: terms
            });

            let endpoint = '/taxonomies/?perpage=12';
            if (name != undefined && name != '')
                endpoint += '&search=' + name;

            tainacan.get(endpoint)
                .then(response => {
                    taxonomies = response.data.map((taxonomy) => ({ name: taxonomy.name, value: taxonomy.id + "" }));
                    isLoadingTaxonomies = false; 

                    setAttributes({ 
                        isLoadingTaxonomies: isLoadingTaxonomies, 
                        taxonomies: taxonomies
                    });
                    
                    return taxonomies;
                })
                .catch(error => {
                    console.log('Error trying to fetch taxonomies: ' + error);
                });
        }

        function fetchTerms(name) {

            let endpoint = '/taxonomy/'+ taxonomyId + '/terms/?number=12';

            if (name != undefined && name != '')
                endpoint += '&searchterm=' + name;

            tainacan.get(endpoint)
                .then(response => {

                    terms = response.data.map((term) => ({ 
                        name: term.name, 
                        value: term.id + "", // same as string version of id, because autocomplete expects value
                        id: term.id,
                        url: term.url,
                        header_image: [{
                            src: term.header_image,
                            alt: term.name
                        }]
                    }));
                    isLoadingTerms = false; 

                    setAttributes({ 
                        isLoadingTerms: isLoadingTerms, 
                        terms: terms
                    });
                    
                    return terms;
                })
                .catch(error => {
                    console.log('Error trying to fetch terms: ' + error);
                });
        }

        function fetchTaxonomy() {
            tainacan.get('/taxonomies/' + taxonomyId)
                .then((response) => {
                    taxonomyName = response.data.name;
                    setAttributes({ taxonomyName: taxonomyName });
                }).catch(error => {
                    console.log('Error trying to fetch taxonomy: ' + error);
                });
        }

        function selectTerm(term) {
            let existingTermIndex = selectedTermsObject.findIndex((existingTerm) => existingTerm.id == 'term-id-' + term.id);

            if (existingTermIndex < 0) {
                let termId = isNaN(term.id) ? term.id : 'term-id-' + term.id;
                selectedTermsObject.push({
                    id: termId,
                    name: term.name,
                    url: term.url,
                    header_image: term.header_image
                });
            }

            setContent();
        }

        function removeTermOfId(termId) {

            let existingTermIndex = selectedTermsObject.findIndex((existingTerm) => ((existingTerm.id == 'term-id-' + termId) || (existingTerm.id == termId)));

            if (existingTermIndex >= 0)
                selectedTermsObject.splice(existingTermIndex, 1);

            setContent();
        }

        function updateLayout(newLayout) {
            layout = newLayout;

            setAttributes({ layout: newLayout });
            setContent();
        }

        // Executed every time Edit function runs
        if (taxonomyId != null && taxonomyId != '')
            fetchTaxonomy();
        
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
                icon: 'exerpt-view',
                title: __( 'Card View' ),
                onClick: () => updateLayout('card'),
                isActive: layout === 'card',
            },
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
                        <div style={{ marginTop: '24px' }}>
                            <ToggleControl
                                label={__('Image', 'tainacan')}
                                help={ showImage ? __('Toggle to show term\'s image', 'tainacan') : __('Do not show term\'s image', 'tainacan')}
                                checked={ showImage }
                                onChange={ ( isChecked ) => {
                                        showImage = isChecked;
                                        setAttributes({ showImage: showImage });
                                        setContent();
                                    } 
                                }
                            />
                        </div>
                    </InspectorControls>
                </div>

                { isSelected ? 
                    
                        (<div>
                            { isLoadingTaxonomies || isLoadingTerms ? <Spinner /> : null }

                            <div className="block-control">
                                
                                <div className="block-control-item">
                                    <label 
                                        className="autocomplete-label"
                                        htmlFor="taxonomy-autocomplete">
                                        {__('Select a taxonomy', 'tainacan')}
                                    </label>
                                    
                                    <Autocomplete
                                        inputProps={{ id: 'taxonomy-autocomplete' }}
                                        wrapperProps={{ className: 'react-autocomplete' }}
                                        value={ taxonomyName }
                                        items={ taxonomies }
                                        onSelect={(value, item) => {
                                                taxonomyId = value;
                                                taxonomyName = item.name;
                                                setAttributes({ taxonomyId: taxonomyId, taxonomyName: taxonomyName, taxonomies: [ item ] });
                                            }
                                        }
                                        getItemValue={(taxonomy) => taxonomy.value }
                                        onChange={(event, value) => {
                                                taxonomyId = null;
                                                taxonomyName = value;
                                                setAttributes({ taxonomyId: taxonomyId, taxonomyName: taxonomyName });    
                                               _.debounce(fetchTaxonomies(value), 300);
                                            }
                                        }
                                        renderMenu={ children => (
                                            children.length > 0 ? (
                                            <div className="menu">
                                                { children }
                                            </div>
                                            ) : <span></span>
                                        )}
                                        renderItem={(item, isHighlighted) => (
                                            <div
                                                className={`item ${isHighlighted ? 'item-highlighted' : ''}`}
                                                key={item.value}>
                                                {item.name}
                                            </div>
                                        )}/>
                                    </div>   
                                    <div className={'block-control-item' + (taxonomyId == null || taxonomyId == undefined ? ' disabled' : '')}>

                                        <label
                                            className="autocomplete-label"
                                            htmlFor="taxonomy-autocomplete">
                                            {__('Select a term to add', 'tainacan')}
                                        </label>
                                        
                                        <Autocomplete
                                            autoHighlight={true}
                                            inputProps={{ 
                                                id: 'term-autocomplete', 
                                                disabled: taxonomyId == null || taxonomyId == undefined
                                            }}
                                            wrapperProps={{ className: 'react-autocomplete' }}
                                            value={ currentTermName }
                                            items={ terms }
                                            onSelect={(value, item) => {
                                                    currentTermName = '';
                                                    setAttributes({ currentTermName: currentTermName });
                                                    selectTerm(item);
                                                }
                                            }
                                            shouldItemRender={(item) => {
                                                let existingTermIndex = selectedTermsObject.findIndex((existingTerm) => ((existingTerm.id == 'term-id-' + item.id) || (existingTerm.id == item.id)));
                                                return existingTermIndex < 0;
                                            }}
                                            getItemValue={(term) => term.value }
                                            onChange={(event, value) => {   

                                                    currentTermName = value;
                                                    isLoadingTerms = true;
                                                    terms = [];
                                        
                                                    setAttributes({ 
                                                        isLoadingTerms: isLoadingTerms, 
                                                        terms: terms,
                                                        currentTermName: currentTermName 
                                                    });
                                                    _.debounce(fetchTerms(value), 300);
                                                }
                                            }
                                            renderMenu={ children => (
                                                children.length > 0 ? (
                                                <div 
                                                    className="menu">
                                                    { children }
                                                </div>
                                                ) : <span></span>
                                            )}
                                            renderItem={(item, isHighlighted) => (
                                                <div
                                                    className={`item ${isHighlighted ? 'item-highlighted' : ''}`}
                                                    key={ item.id }>
                                                    { item.name }
                                                </div>
                                            )}/>
                                    </div>       
                            </div>
                            <hr/>
                        </div>
                        ) : null
                }

                { !selectedTermsHTML.length ? (
                    <Placeholder
                        icon={(
                            <img
                                width={148}
                                src={ `${tainacan_plugin.base_url}/admin/images/tainacan_logo_header.svg` }
                                alt="Tainacan Logo"/>
                        )}
                    />) : null
                }

                <ul className={'terms-list-edit terms-layout-' + layout}>{ selectedTermsHTML }</ul>
                
            </div>
        );
    },
    save({ attributes }){
        const { content } = attributes;
        return <div>{ content }</div>
    }
});