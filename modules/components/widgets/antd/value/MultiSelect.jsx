import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Select } from "antd";
import {calcTextWidth, SELECT_WIDTH_OFFSET_RIGHT} from "../../../../utils/domUtils";
import {mapListValues} from "../../../../utils/stuff";
import {useOnPropsChanged} from "../../../../utils/reactUtils";
import omit from "lodash/omit";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Alert, Input } from 'reactstrap';
const Option = Select.Option;

export default class MultiSelectWidget extends PureComponent {
  static propTypes = {
    setValue: PropTypes.func.isRequired,
    config: PropTypes.object.isRequired,
    value: PropTypes.array,
    field: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    customProps: PropTypes.object,
    fieldDefinition: PropTypes.object,
    readonly: PropTypes.bool,
    // from fieldSettings:
    listValues: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    allowCustomValues: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    useOnPropsChanged(this);
    this.onPropsChanged(props);
  }

  componentDidMount() {
    console.log("The multiselect mounted")
    console.log("props", this.props)
  }

  componentDidUpdate() {
    console.log("The multiselect was updated")
    console.log("props", this.props)
  }

  onPropsChanged (props) {
    const {listValues} = props;

    let optionsMaxWidth = 0;
    mapListValues(listValues, ({title, value}) => {
      optionsMaxWidth = Math.max(optionsMaxWidth, calcTextWidth(title, null));
    });
    this.optionsMaxWidth = optionsMaxWidth;

    this.options = mapListValues(listValues, ({title, value}) => {
      return (<Option key={value} value={value}>{title}</Option>);
    });
  }

  handleChange = (val) => {
    if (val && !val.length) {
      val = undefined //not allow []
    }
    //Split on separators, space or comma, if allow custom values
    let newValues=[];
    let uniqueValues = {};
    if (Array.isArray(val) && val.length > 0 && this.props.allowCustomValues) {
      val.forEach(record => {
        let values = record.split(/[, ]+/);
        values.forEach(val => {
          if (val.length > 0) {
            if (!(val in uniqueValues)) {
              uniqueValues[val] = 1;
              newValues.push(val);
            }
          }
        });
      });
      this.props.setValue(newValues);
    } else {
      this.props.setValue(val);
    }
  };

  filterOption = (input, option) => {
    const dataForFilter = option.children || option.value;
    return dataForFilter.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  };

  render() {
    const {config, placeholder, allowCustomValues, customProps, value, readonly, field} = this.props;
    const {renderSize} = config.settings;
    const placeholderWidth = calcTextWidth(placeholder);
    const aValue = value && value.length ? value : undefined;
    const width = aValue ? null : placeholderWidth + SELECT_WIDTH_OFFSET_RIGHT;
    const dropdownWidth = this.optionsMaxWidth + SELECT_WIDTH_OFFSET_RIGHT;
    const customSelectProps = omit(customProps, ["showCheckboxes"]);
    
    return (field === "ameps__dob_year" ? 
      <Button size="sm" className="btn-light">+ Add Range</Button> :
      <Select
        disabled={readonly}
        mode={allowCustomValues ? "tags" : "multiple"}
        style={{
          minWidth: width,
          width: width,
        }}
        dropdownStyle={{
          width: dropdownWidth,
        }}
        key={"widget-multiselect"}
        dropdownMatchSelectWidth={false}
        placeholder={placeholder}
        size={renderSize}
        value={aValue}
        onChange={this.handleChange}
        filterOption={this.filterOption}
        {...customSelectProps}
      >{this.options}
      </Select>
    );
  }
}


/**
 * Modal to select range of years
 * @returns 
 */
export function YearsSelector({readonly}) {
  return (<>
    {!readonly && <><Button size="sm" className="btn-light" onClick={this.toggle}>+ Add {this.state.inputType} Range</Button>
      <Modal isOpen={this.state.modal} toggle={this.toggle} className="modal-dialog-centered date-picker">
        <ModalHeader toggle={this.toggle}>{chartType}</ModalHeader>
        <ModalBody>
          <div className='input-range'>
            <div className='ir-start'>
              <label>Start Value</label>
              <Input
                value={this.state.startValue}
                onChange={(ev) => this.onInputChange(ev, 'start')}
                max={this.state.endValue}
              />
            </div>
            <i className="bi bi-arrow-right"></i>
            <div className='ir-end'>
              <label>End Value</label>
              <Input
                value={this.state.endValue}
                onChange={(ev) => this.onInputChange(ev, 'end')}
                max={this.state.endValue}
              />
            </div>
          </div>
          <Alert color="warning" fade isOpen={this.state.error}>
            <i className="bi bi-exclamation-diamond"></i>
            {this.state.errorMessage}
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" size="sm" onClick={this.toggle}>Cancel</Button>
          <Button color="primary" className="promote" size="sm" onClick={this.onRangeCommit}>Add {this.state.inputType} Range</Button>{' '}
        </ModalFooter>
      </Modal>
    </>}
  </>)
}
