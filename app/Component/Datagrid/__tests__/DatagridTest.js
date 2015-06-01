/* global jest,describe,it,beforeEach,expect */

jest.autoMockOff();
jest.setMock('react-router', {Link : require('../../Button/__mocks__/Link')});

var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
var Datagrid = require('../Datagrid');
var routerWrapper = require('../../../Test/RouterWrapper');
var ListView = require('admin-config/lib/View/ListView');
var Entry = require('admin-config/lib/Entry');
var NumberField = require('admin-config/lib/Field/NumberField');
var Field = require('admin-config/lib/Field/Field');
var DateField = require('admin-config/lib/Field/DateField');

function getDatagrid(name, entityName, fields, view, router, entries, sortDir, sortField) {
    return routerWrapper(() => <Datagrid
        name={name}
        fields={fields}
        entityName={entityName}
        view={view}
        router={router}
        entries={entries}
        sortDir={sortDir}
        sortField={sortField}
        listActions={view.listActions()}/>
    );
}

describe('Datagrid', () => {
    var view;
    var router;
    var fields;

    beforeEach(() => {
        view = new ListView('myView');

        router = {
            getCurrentQuery: () => 1
        };

        fields = [
            new NumberField('id').label('#'),
            new Field('title').label('Title'),
            new DateField('created_at').label('Creation date')
        ];
    });

    describe('Column headers', () => {
        it('should set header with correct label for each field', () => {
            var datagrid = getDatagrid('myView', 'myEntity', fields, view, router, [], null, null);
            datagrid = React.findDOMNode(datagrid);

            var headers = [].slice.call(datagrid.querySelectorAll('thead th')).map(h => h.textContent);
            expect(headers).toEqual(['#', 'Title', 'Creation date']);
        });

        it('should send `sort` event to datagrid when clicking on header', () => {
            var datagrid = getDatagrid('myView', 'myEntity', fields, view, router, [], null, null);
            var datagridNode = React.findDOMNode(datagrid);
            var header = datagridNode.querySelector('thead th a');
            TestUtils.Simulate.click(header);

            expect(header.attributes['data-click-to'].value).toEqual('my-route');
        });
    });

    describe('Datagrid entries', () => {
        it('should set rows with correct values for each field', () => {
            var entries = [
                new Entry('posts', { 'id': 1, 'title': 'First Post', 'created_at': '2015-05-27' }, 1),
                new Entry('posts', { 'id': 2, 'title': 'Second Post', 'created_at': '2015-05-28' }, 2),
                new Entry('posts', { 'id': 3, 'title': 'Third Post', 'created_at': '2015-05-29' }, 3)
            ];

            var datagrid = getDatagrid('myView', 'myEntity', fields, view, router, entries);
            var datagridNode = React.findDOMNode(datagrid);
            var rows = datagridNode.querySelectorAll('tbody tr');

            expect(rows.length).toEqual(3);
            expect(rows[0].childNodes.length).toEqual(3);
            expect(rows[0].childNodes[1].textContent).toEqual('First Post');
            expect(rows[2].childNodes[2].textContent).toEqual('2015-05-29');
        });

         it('should set rows with correct values, plus action buttons', () => {
            var entries = [
                new Entry('posts', { 'id': 1, 'title': 'First Post', 'created_at': '2015-05-27' }, 1)
            ];

            var viewWithActions = new ListView('myView');
            viewWithActions.listActions(['edit']);

            var datagrid = getDatagrid('myView', 'myEntity', fields, viewWithActions, router, entries);
            var datagridNode = React.findDOMNode(datagrid);
            var cells = datagridNode.querySelectorAll('tbody tr td');

            expect(cells.length).toEqual(4);
            expect(cells[3].textContent).toContain('Edit');

            var edit = cells[3].querySelector('a');
            TestUtils.Simulate.click(edit);

            expect(edit.attributes['data-click-to'].value).toEqual('edit');
        });
    });
});
