import React from 'react';
import DateColumn from '../Component/Column/DateColumn';
import DateField from '../Component/Field/DateField';

class DateFieldView {
    static getReadWidget() {
        return <DateColumn value={this.props.value} />;
    }

    static getLinkWidget() {
        return <a onClick={this.props.detailAction}><DateColumn value={this.props.value} /></a>;
    }

    static getFilterWidget() {
        // @TODO : Add filter
        return null;
    }

    static getWriteWidget() {
        return <DateField type={"date"} name={this.props.fieldName} field={this.props.field} value={this.props.value} updateField={this.props.updateField} />;
    }
}

export default DateFieldView;
