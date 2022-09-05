import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Action, UserActionType, ICategory, Industry, IMuFilter, ICategorySpec, IMUnit } from '../../../core/models/category';
import { PostMuFilter } from '../../../core/models/majorUnitsData';
import { CompareObjects } from 'projects/marketing/src/lib/comapre';

@Component({
  selector: 'app-campaign-reach',
  templateUrl: './campaign-reach.component.html',
  styleUrls: ['./campaign-reach.component.css']
})
export class CampaignReachComponent implements OnInit {


  ngOnInit(): void {
    this.lastKnownLength = 0;
  }

  @Input() isConsumerFeature: boolean = false;
  @Input() industries: Industry[] = [];
  @Input() locked: boolean = false;
  @Output() updateStatus = new EventEmitter<Action>();
  @Input() isCategorySelected: boolean;
  @ViewChild('scrolToLastItem') private scrollContainer: ElementRef;

  showReach: boolean = true;
  allCategories: ICategory[] = [];
  lastKnownLength: number = 0;
  mufilters: IMuFilter[] = [];
  showUnitsOnLoad: boolean = false;

  ViewLastElement(): void {
    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
  }

  updateMuData(value: IMuFilter, actionType: UserActionType) {
    const newObj = JSON.parse(JSON.stringify(value)) as PostMuFilter;
    if (actionType !== UserActionType.NoAction) {
      if (newObj?.year) {
        if (actionType == UserActionType.None) {
          if (this.mufilters.length === 0) {
            this.mufilters.push(newObj);
          } else {
            this.mufilters.pop();
            this.mufilters.push(newObj);
          }
        } else if (actionType === UserActionType.AddAnother) {
          if (this.mufilters.length === this.lastKnownLength) {
            this.mufilters.push(newObj);
          } else {
            this.mufilters.pop();
            this.mufilters.push(newObj);
          }
        } else if (actionType === UserActionType.Duplicate && this.checkNumberOfTimesItemExist(newObj, false) < 2) {
          this.mufilters.push(newObj);
          this.lastKnownLength = this.mufilters.length;
        }
      }
    } else {
      this.lastKnownLength = this.mufilters.length;
    }
    if (actionType === UserActionType.Remove) {
      this.lastKnownLength--;
    }
    this.ViewLastElement();
  }

  checkNumberOfTimesItemExist(val: any, isCategory: boolean): number {
    let i = 0;
    if (isCategory) {
      this.allCategories.some(x => {
        if (CompareObjects.compare(x, val)) {
          i++;
        }
      });
      return i;
    }
    this.mufilters.some(x => {
      if (CompareObjects.compare(x, val)) {
        i++;
      }
    });
    return i;
  }

  fillCampaignReach(categoryVal: ICategory[], unitValue: IMUnit[], fromArchived: boolean) {
    if (unitValue && unitValue.length > 0) {
      unitValue.forEach(i => {
        this.mufilters.push(i.muFilter);
      });
      this.isCategorySelected = false;
      this.lastKnownLength = this.mufilters.length;
      return;
    }
    if (!fromArchived) {
      this.updateCategoryNamesOnLoad(categoryVal);
      return;
    }
    this.updateCategoryNamesFromArchive(categoryVal);
  }
  
  updateCategoryNamesFromArchive(value: ICategory[]) {
    const newObj = JSON.parse(JSON.stringify(value)) as ICategory[];
    newObj.forEach(x => {
      this.updateIndustryInfo(x);
    });
    this.allCategories = newObj;
  }

  updateIndustryInfo(x: ICategory){
    if (x?.industry) {

      if (x?.industry) {
        x.industry.name = x.industry.name;
      }
      if (x?.productType) {
        x.productType.name = x.productType.name;
      }

      if (x?.productSubType) {
        x.productSubType.name = x.productSubType.name;
      }
    }
  }

  updateCategoryNamesOnLoad(value: ICategory[]) {
    const categories = JSON.parse(JSON.stringify(value)) as ICategory[];
    if (categories.length === 1 && !categories[0].industry) {
      return;
    }

    categories.forEach(x => {
      if (x?.industry) {
        this.updateCategoryInfo(x);
      }
    });
    this.allCategories = categories;
    this.lastKnownLength = this.allCategories.length;
  }

  updateCategoryInfo(x: ICategory) {
    if (x?.industry) {
      x.industry.name = this.getIndustryName(x.industry.id);
    }
    if (x?.productType) {
      x.productType.name = this.getProductTypeName(x.industry.id, x.productType.id);
    }

    if (x?.productSubType) {
      x.productSubType.name = this.getProductSubTypeName({
        indId: x.industry.id,
        prodId: x.productType.id,
        subTypeId: x.productSubType.id
      });
    }
  }

  updateLastCategoryNames(value: ICategory, actionType: UserActionType) {
    const newObj = JSON.parse(JSON.stringify(value)) as ICategory;
    if (actionType === UserActionType.NoAction) {
      this.lastKnownLength = this.allCategories.length;
      return;
    }
   
    if (newObj?.industry) {
      this.getNames(newObj);
      this.updateIndustryLastCategoryNames(newObj,actionType);
    }
    else if (actionType === UserActionType.None && this.allCategories.length !== 0) {
        this.allCategories.splice(this.allCategories.length - 1, 1);
    }
    
    this.ViewLastElement();
    this.lastKnownLength =  this.allCategories?.length;
  }

  updateIndustryLastCategoryNames(newObj: ICategory, actionType: UserActionType) {
    if (actionType === UserActionType.None) {
      this.allCategories.pop();
      this.allCategories.push(newObj);
    } else if (actionType === UserActionType.AddAnother) {
      if (this.allCategories.length !== this.lastKnownLength)
        this.allCategories.pop();

      this.allCategories.push(newObj);
    } else if (actionType === UserActionType.Duplicate && this.checkNumberOfTimesItemExist(newObj, true) < 2) {
      this.allCategories.push(newObj);
      this.lastKnownLength = this.allCategories.length;
    }
  }
  resetCampaignReach() {
    this.lastKnownLength = 0;
    this.allCategories = new Array<ICategory>();
    this.mufilters = new Array<IMuFilter>();
  }

  getNames(newObj: ICategory) {
    if (newObj?.industry) {
      newObj.industry.name = this.getIndustryName(newObj.industry.id);
    }
    if (newObj?.productType) {
      newObj.productType.name = this.getProductTypeName(newObj.industry.id, newObj.productType.id);
    }

    if (newObj?.productSubType) {
      newObj.productSubType.name = this.getProductSubTypeName({
        indId: newObj.industry.id,
        prodId: newObj.productType.id,
        subTypeId: newObj.productSubType.id
      });
    }
  }

  getIndustryName(indId: number) {
    const selectedInd = this.industries.find(x => x.id === indId);
    return selectedInd?.name;
  }

  getProductTypeName(indId: number, prodId: number) {
    const selectedProd = this.industries.find(x => x.id === indId).productTypes.find(y => y.id === prodId);
    return selectedProd?.name;
  }

  getProductSubTypeName(val: ICategorySpec) {
    const selectedSubType = this.industries.find(x => x.id === val.indId).productTypes.find(y => y.id === val.prodId).productSubTypes.find(x => x.id === val.subTypeId);
    return selectedSubType?.name;
  }

  addDuplicateCategory(val: number) {
    this.updateStatus.emit({ actionType: UserActionType.Duplicate, id: val });
  }

  removeCategory(val: number) {
    this.allCategories.splice(val, 1);
    this.lastKnownLength--;
    this.updateStatus.emit({ actionType: UserActionType.Remove, id: val });
  }

  removeMuFilter(val: number) {
    this.mufilters.splice(val, 1);
    this.lastKnownLength--;
  }

  sanitizeCategoryBeforeSave(): ICategory[] {
    const newObj = JSON.parse(JSON.stringify(this.allCategories)) as ICategory[];
    newObj.forEach(x => {
     this.sanitizeCategory(x);
    });
    return this.removeDuplicateCategory(newObj);
  }

  sanitizeCategory(x: ICategory){
    if (x?.industry) {
      x.industry.name = null;
    }
    if (x?.productType) {
      x.productType.name = null;
    }
    if (x?.productSubType) {
      x.productSubType.name = null;
    }
  }

  removeDuplicateCategory(val: ICategory[]): ICategory[] {
    const uniqueCategory = Array<ICategory>();
    val.forEach(i => {
      if (!uniqueCategory.some(x => CompareObjects.compare(x, i))) {
        uniqueCategory.push(i);
      }
    });
    return uniqueCategory;
  }

  removeDuplicateMuData(val: IMUnit[]): IMUnit[] {
    const uniqueMuData = Array<IMUnit>();
    val.forEach(i => {
      if (!uniqueMuData.some(x => CompareObjects.compare(x, i))) {
        uniqueMuData.push(i);
      }
    });
    return uniqueMuData;
  }
}
