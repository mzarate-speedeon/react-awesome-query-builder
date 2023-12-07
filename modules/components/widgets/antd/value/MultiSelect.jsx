import React, { PureComponent, useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Select } from "antd";
import {calcTextWidth, SELECT_WIDTH_OFFSET_RIGHT} from "../../../../utils/domUtils";
import {mapListValues} from "../../../../utils/stuff";
import {useOnPropsChanged} from "../../../../utils/reactUtils";
import omit from "lodash/omit";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Alert, Input } from 'reactstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
      selectedYearRange: this.props.value || [],
    }
  }

  componentDidMount() {
    if(this.props.value) {
      this.props.setValue(this.props.value)
    }
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
    this.setState(() => {
      return { selectedYearRange: val };
    }, () => {
      this.props.setValue(this.state.selectedYearRange);
    });
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

    const bday_range = "ameps__birthday_of_person_with_day_enhanced"; //yyyymmdd
    const year_range = "ameps__dob_year";

    // modal helpers
    const toggleModal = () => {
      this.setState({showModal: !this.state.showModal})
    }

    if(field === year_range) {
      return (
        <>
          {!readonly && <button className="add-edit-range" onClick={toggleModal}>Add/Edit</button>}
          {
            this.state.selectedYearRange.length ? (<span className="range-wrapper">{this.state.selectedYearRange.map((range) => {
              return (
                <span className="range-details" key={range}>{range}</span>
              );
            })}</span>) : ""
          }
          { this.state.showModal && <YearsSelector
            show={this.state.showModal}
            toggle={toggleModal}
            addNew={this.handleYearsRange}
            currentSelections={this.state.selectedYearRange}
          />}
        </>
      );
    }

    if(field === bday_range) {
      return (
        <>
          {!readonly && <button className="add-edit-range" onClick={toggleModal}>Add/Edit</button>}
          {
            this.state.selectedYearRange.length ? (<span className="range-wrapper">{this.state.selectedYearRange.map((range) => {
              return (
                <span className="range-details" key={range}>{range}</span>
              );
            })}</span>) : ""
          }
          { this.state.showModal && <BdaySelector
            show={this.state.showModal}
            toggle={toggleModal}
            addNew={this.handleYearsRange}
            currentSelections={this.state.selectedYearRange}
          />}
        </>
      );
    }
    
    return (
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
 */
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let allYears = [];
function populateYears() {
  for (let i = (currentYear - 110); i <= (currentYear); i++) {
    allYears.push(i);
  }
}
populateYears();
allYears.reverse();

export function YearsSelector({toggle, addNew, show, currentSelections}) {

  const [selectedRanges, setSelectedRanges] = useState(currentSelections || []);
  const [endYearList, setEndYearList] = useState(allYears);
  const [startYear, setStartYear] = useState();
  const [endYear, setEndYear] = useState();
  const [ready, setReady] = useState(false);

  const startYearRef = useRef(null);
  const endYearRef = useRef(null);

  const handleAddRange = () => {
    if (startYearRef.current.value && endYearRef.current.value) {
      let newRange = `${startYearRef.current.value}|${endYearRef.current.value}`;
      if(!selectedRanges.includes(newRange)) {
        let updatedState = [...selectedRanges, newRange];
        setSelectedRanges(updatedState);
        addNew(updatedState);
      }
      toggle();
    }
  }

  const handleUpdateStartYear = () => {
    setStartYear(startYearRef.current.value);
  }

  const handleUpdateEndYear = () => {
    setEndYear(endYearRef.current.value);
  }

  const handleDeleteRange = (el) => {
    let indexToRemove = selectedRanges.indexOf(el);
    let updatedArray = selectedRanges.filter((_,index) => index !== indexToRemove );
    setSelectedRanges(updatedArray);
    addNew(updatedArray);
  }

  useEffect(() => {
    if(startYear) {
      const reducedList = allYears.filter(checkYears);
      function checkYears(year) {
        return parseInt(year) >= parseInt(startYear);
      }
      setEndYearList(reducedList); // only years after the starting year
    } else {
      setEndYearList(allYears); // all years
    }
  }, [startYear])

  useEffect(() => {
    if(startYear && endYear) {
      setReady(true);
    } else {
      setReady(false);
    }
  }, [startYear, endYear])

  return (<>
      <Modal isOpen={show} className="modal-dialog-centered date-picker">
        <ModalHeader>Year Person Was Born</ModalHeader>
        <ModalBody>
          <div className='input-range custom-select'>
            <div className='ir-start'>
              <label>Start Value</label>
              <select ref={startYearRef} onChange={handleUpdateStartYear}>
                <option key={`default-start`} value={0}>Select a value</option>
                {allYears.map((year) => {
                  return <option key={`${year}-start`} value={year}>{year}</option>;
                })}
              </select>
            </div>
            <i className="bi bi-arrow-right"></i>
            <div className='ir-end'>
              <label>End Value</label>
              <select ref={endYearRef} onChange={handleUpdateEndYear}>
                <option key={`default-end`} value={0}>Select a value</option>
                {endYearList.map((year) => {
                  return <option key={`${year}-end`} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
          <hr />
          {selectedRanges &&
            <div className="year-editor-section">
              {selectedRanges.map((range) => {
                return (<div className="year-range">
                  <span className="range">{range}</span>
                  <span className="delete-icon">
                    <i className="bi bi-trash" onClick={() => handleDeleteRange(range)}/>
                  </span>
                </div>)
              })}
            </div>
          }
          
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" size="sm" onClick={toggle}>Close</Button>
          <Button color="primary" className="promote" size="sm" 
            onClick={handleAddRange}
            disabled={!ready}
          >
              Add Selection
          </Button>{' '}
        </ModalFooter>
      </Modal>
  </>)
}


/**
 * Modal to select birthday dates
 */
function subtractYears(date, years) {
  date.setFullYear(date.getFullYear() - years);
  return date;
}

export function BdaySelector({toggle, addNew, show, currentSelections}) {
  const [selectedRanges, setSelectedRanges] = useState(currentSelections || []);
  const [startDate, setStartDate] = useState(new Date());
  const [minDate, setMinDate] = useState(subtractYears(new Date(), 110));

  const handleStartChange = (val) => {
    console.log("start got:", val)
  }

  return (<>
    <Modal isOpen={show} className="modal-dialog-centered date-picker">
      <ModalHeader>Year Person Was Born</ModalHeader>
      <ModalBody>
        <div className='datepicker'>
          <div className='dp-start'>
            <label>Start Date</label>
            <DatePicker
              startDate={startDate}
              selected={startDate}
              onChange={handleStartChange}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              minDate={minDate}
              maxDate={subtractYears(new Date(), 18)}
              >
            </DatePicker>
          </div>
          <div className='dp-end'>
            <label>End Date</label>
            <DatePicker
              endDate={null}
              selected={null}
              onChange={(ev, endDate) => console.log(ev, endDate, 'end')}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              minDate={null}
              maxDate={null}
            >
            </DatePicker>
          </div>
        </div>
        <hr />
        {selectedRanges &&
          <div className="year-editor-section">
            {selectedRanges.map((range) => {
              return (<div className="year-range">
                <span className="range">{range}</span>
                <span className="delete-icon">
                  {/* <i className="bi bi-trash" onClick={() => handleDeleteRange(range)}/> */}
                </span>
              </div>)
            })}
          </div>
        }
        
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" size="sm" onClick={toggle}>Close</Button>
        {/* <Button color="primary" className="promote" size="sm" 
          onClick={handleAddRange}
          disabled={!ready}
        >
            Add Selection
        </Button>{' '} */}
      </ModalFooter>
    </Modal>
</>)
}


{/* 
    <div className='datepicker'>
      <div className='dp-start'>
        <label>Start Date</label>
        <DatePicker
          startDate={this.state.startDate}
          selected={this.state.startDate || maxDate}
          onChange={(ev, startDate) => this.onDateChange(ev, startDate, 'start')}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          minDate={minDate}
          maxDate={this.state.startDateMax || maxDate}
          >
        </DatePicker>
      </div>
      <div className='dp-end'>
        <label>End Date</label>
        <DatePicker
          endDate={this.state.endDate}
          selected={this.state.endDate}
          onChange={(ev, endDate) => this.onDateChange(ev, endDate, 'end')}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          minDate={this.state.startDate || minDate}
          maxDate={maxDateEnd}
        >
        </DatePicker>
      </div>
    </div>
 */}