import logo from '../../../public/images/mainlogo.webp'
import "./Header_Style.css"

const Header = () => {
    return (
        <header>
            <div>
                <img src={logo} style={{width:"100%"}}/>
            </div>
            <hr className='hr'></hr>

            <div className="container">
                <div className='list'>Workstation</div>
                <div className='list'>Inpiration</div>
                <div className='list'>Contact</div>
            </div>

            <hr className='hr'></hr>
        </header>
    );
}

export default Header
