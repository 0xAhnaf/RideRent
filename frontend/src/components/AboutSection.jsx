import {
  ShieldCheck,
  Car,
  Users,
  Clock
} from "lucide-react";


import aboutImage from "../assets/about-car.png";

import "../styles/about.css";



function AboutSection(){


return(

<section className="about-section">


<div className="about-container">





{/* IMAGE SIDE */}


<div className="about-image-box">


<img

src={aboutImage}

alt="RideRent Car Service"

/>


</div>








{/* CONTENT SIDE */}


<div className="about-content">


<div className="about-tag">

ABOUT RIDERENT

</div>



<h2>

Your Trusted Partner
For Every Journey

</h2>



<p>

RideRent is a modern transportation platform
providing reliable car rental, professional drivers,
and emergency mobility solutions. Our goal is to make
every journey safe, comfortable, and hassle-free.

</p>



<p>

From daily travel to special occasions and emergency
requirements, RideRent connects customers with
well-maintained vehicles and trusted services.

</p>







<div className="about-features">



<div className="about-feature">


<ShieldCheck/>

<div>

<h4>
Verified Vehicles
</h4>

<span>
Safe and reliable cars
</span>

</div>


</div>





<div className="about-feature">


<Car/>

<div>

<h4>
Wide Vehicle Options
</h4>

<span>
Cars for every journey
</span>

</div>


</div>






<div className="about-feature">


<Users/>

<div>

<h4>
Professional Drivers
</h4>

<span>
Experienced and trusted
</span>

</div>


</div>






<div className="about-feature">


<Clock/>

<div>

<h4>
24/7 Support
</h4>

<span>
Always ready to help
</span>

</div>


</div>



</div>



</div>



</div>


</section>

);


}


export default AboutSection;