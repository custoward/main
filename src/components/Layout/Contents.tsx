import "./style.css"

const Contents = (props : {children : React.ReactNode}) => {
    return(
        <div className="Contents">
            {props.children}
        </div>
    )
}

export default Contents