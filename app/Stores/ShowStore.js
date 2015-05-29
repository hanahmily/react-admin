import { EventEmitter } from 'events';
import { fromJS, Map, List } from 'immutable';
import objectAssign from 'object-assign';
import PathUtils from 'react-router/lib/PathUtils';

import AppDispatcher from '../Services/AppDispatcher';

import ReadQueries from 'admin-config/lib/Queries/ReadQueries';
import PromisesResolver from 'admin-config/lib/Utils/PromisesResolver';
import DataStore from 'admin-config/lib/DataStore/DataStore';

import RestWrapper from '../Services/RestWrapper';

class ShowStore extends EventEmitter {
    constructor(...args) {
        super(...args);

        this.data = Map({
            pending: true,
            dataStore: List()
        });
    }

    loadData(configuration, view, identifierValue) {
        this.data = this.data.update('pending', v => true);
        this.emitChange();

        let dataStore = new DataStore();
        let readQueries = new ReadQueries(new RestWrapper(), PromisesResolver, configuration);
        let rawEntry, entry, nonOptimizedReferencedData, optimizedReferencedData;
        let {sortDir, sortField} = PathUtils.extractQuery(window.location.hash) || {};

        readQueries
            .getOne(view.getEntity(), view.type, identifierValue, view.identifier(), view.getUrl())
            .then((response) => {
                rawEntry = response;

                entry = dataStore.mapEntry(
                    view.entity.name(),
                    view.identifier(),
                    view.getFields(),
                    rawEntry
                );

                return rawEntry;
            }, this)
            .then((rawEntry) => {
                return readQueries.getFilteredReferenceData(view.getNonOptimizedReferences(), [rawEntry]);
            })
            .then((nonOptimizedReference) => {
                nonOptimizedReferencedData = nonOptimizedReference;

                return readQueries.getOptimizedReferencedData(view.getOptimizedReferences(), [rawEntry]);
            })
            .then((optimizedReference) => {
                optimizedReferencedData = optimizedReference;

                var references = view.getReferences(),
                    referencedData = objectAssign(nonOptimizedReferencedData, optimizedReferencedData),
                    referencedEntries;

                for (var name in referencedData) {
                    referencedEntries = dataStore.mapEntries(
                        references[name].targetEntity().name(),
                        references[name].targetEntity().identifier(),
                        [references[name].targetField()],
                        referencedData[name]
                    );

                    dataStore.setEntries(
                        references[name].targetEntity().uniqueId + '_values',
                        referencedEntries
                    );
                }
            })
            .then(() => {
                var referencedLists = view.getReferencedLists();

                return readQueries.getReferencedListData(referencedLists, sortField, sortDir, entry.identifierValue);
            })
            .then((referencedListData) => {
                var referencedLists = view.getReferencedLists();
                var referencedList;
                var referencedListEntries;

                for (var i in referencedLists) {
                    referencedList = referencedLists[i];
                    referencedListEntries = referencedListData[i];

                    referencedListEntries = dataStore.mapEntries(
                        referencedList.targetEntity().name(),
                        referencedList.targetEntity().identifier(),
                        referencedList.targetFields(),
                        referencedListEntries
                    );

                    dataStore.setEntries(
                        referencedList.targetEntity().uniqueId + '_list',
                        referencedListEntries
                    );
                }
            })
            .then(() => {
                dataStore.fillReferencesValuesFromEntry(entry, view.getReferences(), true);

                dataStore.addEntry(view.getEntity().uniqueId, entry);
                return true;
            })
            .then(() => {
                this.data = this.data.update('dataStore', v => dataStore);
                this.data = this.data.update('pending', v => false);
                this.emitChange();
            }, this);
    }

    getState() {
        return { data: this.data };
    }

    emitChange() {
        this.emit('show_load');
    }

    addChangeListener(callback) {
        this.on('show_load', callback);
    }

    removeChangeListener(callback) {
        this.removeListener('show_load', callback);
    }
}

let store = new ShowStore();

AppDispatcher.register((action) => {
    switch(action.actionType) {
        case 'load_show_data':
            store.loadData(action.configuration, action.view, action.id);
            break;
    }
});

export default store;
