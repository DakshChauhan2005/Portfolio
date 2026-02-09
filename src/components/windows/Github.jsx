import React from 'react'
import MacWindow from './MacWindow'
import githubData from '../../assets/github.json'
import './github.scss'

const GitCard = ({ data = { id: 1, image: "", title: "", description: "", tags: [], repoLink: "", demoLink: "" } }) => {
    return <div className='card'>
        <img src={data.image} alt="" />
        <h3>{data.title}</h3>
        <p>{data.description}</p>
        <div className="tags">
            {
                data.tags.map(tag => {
                    return <span key={tag} className='tag'>{tag}</span>
                })
            }
        </div>
        <div className="urls">
            <a href={data.repoLink}>Repository</a>
            { data.demoLink && <a href={data.demoLink}>Demo</a>}
        </div>
    </div>
}

const Github = ({ windowsState, windowName, setWindowsState   }) => {
    return (
        <MacWindow windowName={windowName} windowsState={windowsState} setWindowsState={setWindowsState}>
            <div className="cards">
                {githubData.map(project => {
                    return <GitCard key={project.id} data={project} />
                })}
            </div>
        </MacWindow>
    )
}

export default Github
