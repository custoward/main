import logo from '../../../public/images/mainlogo.webp'
import "./Header_Style.css"

const Header = () => {
    return (
        <header>
            <img src={logo} className="image"/>
            <div className='Hcontainer'>
                <div className='instruction'>Since 2021, Clickin-buckle, Custoward, and finally</div>
                <div className='instruction'>DAVI-DAVI</div>
            </div>
            <hr className='hr'></hr>
            <div className="container">
                <div className='list'>DANDALION</div>
                <div className='list'>VIRUS</div>
                <div className='list'>CONTACT</div>
            </div>
            <hr className='hr'></hr>
        </header>
    );
}

export default Header
