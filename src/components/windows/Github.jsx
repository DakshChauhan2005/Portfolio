import React from 'react'
import { projects } from '../../data/projects'
import asset from '../../utils/asset'
import './github.scss'

/** "RAG Codebase Chatbot" -> "RC". Used by the placeholder tile. */
const monogram = (title) =>
    title
        .split('—')[0]
        .trim()
        .split(/[\s-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()

const GitCard = ({ data }) => (
    <div className='card'>
        {data.image
            ? <img className='thumb' src={asset(data.image)} alt={`${data.title} screenshot`} loading='lazy' />
            : <div className='thumb placeholder' data-variant={data.id % 4} aria-hidden='true'>
                <span>{monogram(data.title)}</span>
            </div>
        }
        <h3>{data.title}</h3>
        <p>{data.description}</p>
        <div className="tags">
            {data.tags.map(tag => <span key={tag} className='tag'>{tag}</span>)}
        </div>
        <div className="urls">
            <a href={data.repoLink} target='_blank' rel='noopener noreferrer'>Repository</a>
            {data.demoLink && <a href={data.demoLink} target='_blank' rel='noopener noreferrer'>Live Demo</a>}
        </div>
    </div>
)

const Github = () => (
    <div className="cards">
        {projects.map(project => <GitCard key={project.id} data={project} />)}
    </div>
)

export default Github
