import "../../components/Layout/style.css"
import "./Homecontainer.css"

const Homecontainer = () => {
    return (
        <div style={{ height: "700px" }}>
            <div className="main">
                <hr className='hr' style={{ borderTop: "dotted"}}></hr>
                <div className="maincontainer">
                    <div className="mainlist">1x Dandelion</div>
                    <div className="maincost">$</div>
                    <div className="maincost">100.00</div>
                    <div className="mainlist">1x Virus</div>
                    <div className="maincost">$</div>
                    <div className="maincost">24.00</div>
                    <div className="mainlist">1x Virus becomes</div>
                    <div className="maincost">$</div>
                    <div className="maincost">24.00</div>
                    <div className="mainlist">1x Dandelion</div>
                    <div className="maincost">$</div>
                    <div className="maincost">100.00</div>
                </div>
                <hr className='hr' style={{ borderTop: "dotted"}}></hr>
                <div className="maincontainer">
                    <div className="mainlist" style={{fontWeight:"1000"}}>TOTAL AMOUNT</div>
                    <div className="maincost">$</div>
                    <div className="maincost">248.00</div>
                    <div className="mainlist">CASH</div>
                    <div className="maincost">$</div>
                    <div className="maincost">250.00</div>
                    <div className="mainlist">CHANGE</div>
                    <div className="maincost">$</div>
                    <div className="maincost">2.00</div>
                </div>
                <hr className='hr' style={{ borderTop: "dotted"}}></hr>
            </div>
            <hr className='hr'></hr>
            <div>
                <p style={{ fontSize: "var(--font-size-sm)", fontWeight:"1000"}}>Welcome to our Playground!</p>
            </div>
        </div>
    )
}

export default Homecontainer