import citlogo from '../../images/citlogo.png';

export default function Contact() {
    return (
        <div>
            <div className="center-wrapper about-wrapper">
                <div className="wrapper">
                    <h1 style={{paddingBottom: "35px"}}>Contact Us</h1>

                    <div style={{
                        display: 'flex',          
                        alignItems: 'center', 
                        justifyContent: 'center'    
                    }}>
                        <img 
                            src={citlogo} 
                            alt="CIT LOGO" 
                            style={{ width: "60px" }} 
                        />
                        <h2 style={{ margin: 0 }}>Cebu Institute of Technology University</h2>

                        
                    </div>
                    
                    <div className= "emails_contactus" style={{display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"}}>
                    
                    <p><a href="#">jefferus.resuera@cit.edu</a> | <a href="#">junjie.geraldez@cit.edu</a> | <a href="#">josan.sumarago@cit.edu</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}