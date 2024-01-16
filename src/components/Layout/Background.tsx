import exp from 'constants';
import './style.css';

const Background = (props : {children : React.ReactNode}) => {
    return(
        <div className="background">
             {props.children}
        </div>
    )
}

export default Background