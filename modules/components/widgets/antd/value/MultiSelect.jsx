import React, { PureComponent, useRef } from "react";
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
    this.state = {
      showModal: false,
    }
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

  handleYearsRange = (val) => {
    this.props.setValue(val);
  }

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

    // modal helpers
    const toggleModal = () => {
      this.setState({showModal: !this.state.showModal})
      console.log("toggleModal clicked", this.state.showModal)
    }
    
    return (field === "ameps__dob_year" ? 
      <>
        {!readonly && <Button size="sm" className="btn-light" onClick={toggleModal}>+ Add Range</Button>}
        <span>{value}</span>
        { this.state.showModal && <YearsSelector
           show={this.state.showModal}
           toggle={toggleModal}
           addNew={(val) => this.handleYearsRange(val)}
        />}
      </>
      :
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
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let allYears = [];
function populateYears() {
  for (let i = (currentYear - 110); i <= (currentYear - 18); i++) {
    allYears.push(i);
  }
}
populateYears();
allYears.reverse();

// function getYearsBetween(start, end) {
//   let startYear = 0;
//   let endYear = 0;
//   let totalYears = 0;
//   let listOfYears = [];
//   if(parseInt(start) < parseInt(end)) {
//     startYear = start;
//     endYear = end;
//   } else { // invert the values
//     startYear = end;
//     endYear = start;
//   }
//   totalYears = parseInt(endYear) - parseInt(startYear);
//   if(totalYears > 0) {
//     for (let i = 0; i <= totalYears; i++) {
//       listOfYears.push(parseInt(startYear) + i);
//     }
//   }
//   return listOfYears;
// }

export function YearsSelector({toggle, addNew, show}) {

  const startYearRef = useRef(null);
  const endYearRef = useRef(null);

  const handleAddRange = () => {
    if (startYearRef.current.value && endYearRef.current.value) {
      let newRange = [`${startYearRef.current.value}|${endYearRef.current.value}`];
      addNew(newRange);
      toggle();
    }
  }

  return (<>
      <Modal isOpen={show} className="modal-dialog-centered date-picker">
        <ModalHeader>Year Person Was Born</ModalHeader>
        <ModalBody>
          <div className='input-range'>
            <div className='ir-start'>
              <label>Start Value</label>
              <select ref={startYearRef}>
                <option key={`default-start`} value={0}>Select a value</option>
                {allYears.map((year) => {
                  return <option key={`${year}-start`} value={year}>{year}</option>;
                })}
              </select>
            </div>
            <i className="bi bi-arrow-right"></i>
            <div className='ir-end'>
              <label>End Value</label>
              <select ref={endYearRef}>
                <option key={`default-end`} value={0}>Select a value</option>
                {allYears.map((year) => {
                  return <option key={`${year}-end`} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" size="sm" onClick={toggle}>Cancel</Button>
          <Button color="primary" className="promote" size="sm" 
            onClick={handleAddRange}
          >
              Add Selection
          </Button>{' '}
        </ModalFooter>
      </Modal>
  </>)
}
