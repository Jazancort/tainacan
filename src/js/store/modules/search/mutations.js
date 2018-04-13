import Vue from 'vue';

export const setPostQueryAttribute = ( state, { attr, value }) => {
    Vue.set( state.postquery, attr , value );
};

export const setPostQuery = ( state, postquery ) => {
    state.postquery = postquery;
};

export const addMetaQuery = ( state, filter ) => {
    state.postquery.metaquery = ( ! state.postquery.metaquery ) ? [] : state.postquery.metaquery;
    let index = state.postquery.metaquery.findIndex( item => item.key === filter.field_id);
    if ( index >= 0 ){
        Vue.set( state.postquery.metaquery, index, {
            key: filter.field_id,
            value: filter.value,
            compare: filter.compare,
            type: filter.type
        } );
    }else{
        state.postquery.metaquery.push({
            key: filter.field_id,
            value: filter.value,
            compare: filter.compare,
            type: filter.type
        });
    }
};

export const addTaxQuery = ( state, filter ) => {
    state.postquery.taxquery = ( ! state.postquery.taxquery ) ? [] : state.postquery.taxquery;
    let index = state.postquery.taxquery.findIndex( item => item.taxonomy === filter.taxonomy);
    if ( index >= 0 ){
        Vue.set( state.postquery.taxquery, index, {
            taxonomy: filter.taxonomy,
            terms: filter.terms,
            compare: filter.compare
        } );
    }else{
        state.postquery.taxquery.push({
            taxonomy: filter.taxonomy,
            terms: filter.terms,
            compare: filter.compare
        });
    }
};

export const removeMetaQuery = ( state, filter ) => {
    let index = state.postquery.metaquery.findIndex( item => item.key === filter.field_id);
    if (index >= 0) {
        state.postquery.metaquery.splice(index, 1);
    }
};

export const removeTaxQuery = ( state, filter ) => {
    let index = state.postquery.taxquery.findIndex( item => item.taxonomy === filter.taxonomy);
    if (index >= 0) {
        state.postquery.taxquery.splice(index, 1);
    }
};


export const setTotalItems = ( state, total ) => {
    state.totalItems = total;
};
