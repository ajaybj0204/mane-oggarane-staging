'use client';
import {useApp,type FoodPreference} from './AppProvider';
const options:{value:FoodPreference;label:string}[]=[{value:'veg',label:'🟢 Veg'},{value:'nonveg',label:'🔴 Non-Veg'},{value:'both',label:'Both'}];
export default function FoodPreferenceSelector(){const {foodPreference,setFoodPreference}=useApp();return <div className="food-preference" role="group" aria-label="Food preference"><span className="food-preference-title">Your food preference</span><div className="food-preference-options">{options.map(o=><button key={o.value} type="button" aria-pressed={foodPreference===o.value} className={foodPreference===o.value?'selected':''} onClick={()=>setFoodPreference(o.value)}>{o.label}</button>)}</div></div>}
