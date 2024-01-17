import "../../components/Layout/style.css"

const Homecontainer = () =>{
    return(
        <div style={{height: "500px"}}>
            <h2 style={{fontSize: "var(--font-size-lg)"}}>Welcome</h2>
            <hr className='hr'></hr>
            <p style={{fontSize: "var(--font-size-md)"}}>This is our playground</p>
        </div>
    )
}

export default Homecontainer