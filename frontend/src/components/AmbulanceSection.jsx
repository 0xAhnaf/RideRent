import {
  MapPin,
  Phone,
  Ambulance
} from "lucide-react";

import { useState } from "react";

import { locations } from "../data/locations";

import ambulanceOne from "../assets/ambulance.png";
import ambulanceTwo from "../assets/ambulance2.png";

import "../styles/ambulance.css";


function AmbulanceSection(){


const [pickupDistrict,setPickupDistrict] = useState("");
const [pickupThanas,setPickupThanas] = useState([]);

const [destinationDistrict,setDestinationDistrict] = useState("");
const [destinationThanas,setDestinationThanas] = useState([]);



const allDistricts = Object.values(locations)
.flatMap((division)=>Object.keys(division));



const getThanas=(district)=>{

let thanas=[];


Object.values(locations).forEach((division)=>{

if(division[district]){

thanas = division[district];

}

});


return thanas;

};





return(

<section className="ambulance-section">


<div className="ambulance-container">



{/* LEFT FORM */}


<div className="ambulance-form-box">


<div className="ambulance-header">


<h2>
🚨 Emergency Ambulance Service
</h2>


<p>
Fast and reliable ambulance support when every second matters.
</p>


</div>





<div className="ambulance-scroll">





<div className="ambulance-field">

<label>
<MapPin size={16}/>
Pickup District
</label>


<select

onChange={(e)=>{

const district=e.target.value;

setPickupDistrict(district);

setPickupThanas(
getThanas(district)
);

}}

>


<option>
Select District
</option>


{

allDistricts.map((district)=>(

<option key={district}>
{district}
</option>

))

}


</select>


</div>







<div className="ambulance-field">

<label>
<MapPin size={16}/>
Pickup Thana
</label>


<select>


<option>
Select Thana
</option>


{

pickupThanas.map((thana)=>(

<option key={thana}>
{thana}
</option>

))

}


</select>


</div>







<div className="ambulance-field">

<label>
<MapPin size={16}/>
Pickup Address
</label>


<input type="text"/>


</div>









<div className="ambulance-field">

<label>
<MapPin size={16}/>
Destination District
</label>


<select

onChange={(e)=>{

const district=e.target.value;

setDestinationDistrict(district);

setDestinationThanas(
getThanas(district)
);

}}

>


<option>
Select District
</option>



{

allDistricts.map((district)=>(

<option key={district}>
{district}
</option>

))

}


</select>


</div>








<div className="ambulance-field">

<label>
<MapPin size={16}/>
Destination Thana
</label>


<select>


<option>
Select Thana
</option>


{

destinationThanas.map((thana)=>(

<option key={thana}>
{thana}
</option>

))

}


</select>


</div>







<div className="ambulance-field">

<label>
<MapPin size={16}/>
Destination Address
</label>


<input type="text"/>


</div>







<div className="ambulance-field">

<label>
<Phone size={16}/>
Emergency Contact Number
</label>


<input 
type="text"
placeholder="01XXXXXXXXX"
/>


</div>







<button className="ambulance-btn">

<Ambulance size={18}/>

BOOK AMBULANCE NOW

</button>





</div>


</div>









{/* RIGHT IMAGE */}


<div className="ambulance-image-box">


<div className="emergency-badge">

24/7 AVAILABLE

</div>



<img

src={ambulanceOne}

className="ambulance-img-one"

alt="RideRent Ambulance"

/>



<img

src={ambulanceTwo}

className="ambulance-img-two"

alt="RideRent Ambulance"

/>



</div>






</div>


</section>

)


}


export default AmbulanceSection;