import React from 'react'
import MacWindow from './MacWindow'
import Terminal from 'react-console-emulator'
import './cli.scss'
const Cli = ({ windowsState, windowName, setWindowsState   }) => {
    const commands = {
        echo: {
            description: 'Echo a passed string.',
            usage: 'echo <string>',
            fn: (...args) => args.join(' ')
        },
        ls: {
            description: 'List files in current directory',
            fn: () => 'Documents/  Downloads/  Projects/  cli.jsx  app.jsx'
        },
        pwd: {
            description: 'Print working directory',
            fn: () => '/home/user'
        },
        whoami: {
            description: 'Show current user',
            fn: () => 'guest'
        },
        date: {
            description: 'Show current date',
            fn: () => new Date().toString()
        },
        history: {
            description: 'Show command history',
            fn: () => 'Command history: help, echo hello, ls' // Mock history
        },
        about: {
            description: 'About this portfolio',
            fn: () => 'Welcome to my portfolio! I\'m a passionate developer building amazing web applications. Explore my projects, skills, and experience.'
        },
        projects: {
            description: 'List my projects',
            fn: () => `My Projects:
1. Mac OS Portfolio - A React-based macOS-inspired portfolio website
2. CLI Terminal - Interactive terminal component for web apps
3. Github Viewer - Component to display GitHub repositories
4. Notes App - Simple note-taking application
5. Spotify Clone - Music player interface

Type 'project <number>' for more details.`
        },
        project: {
            description: 'Get details about a specific project',
            usage: 'project <number>',
            fn: (num) => {
                const projects = {
                    1: 'Mac OS Portfolio: Built with React, Vite, and SCSS. Features interactive windows and components mimicking macOS interface.',
                    2: 'CLI Terminal: React component using react-console-emulator for an interactive terminal experience.',
                    3: 'Github Viewer: Displays GitHub repositories with stats and links.',
                    4: 'Notes App: Simple note-taking app with local storage.',
                    5: 'Spotify Clone: Music player interface with playlist functionality.'
                };
                return projects[num] || 'Project not found. Use "projects" to see available projects.';
            }
        },
        skills: {
            description: 'List my technical skills',
            fn: () => `Technical Skills:
Frontend: React, JavaScript, HTML, CSS, SCSS, TypeScript
Backend: Node.js, Express, Python
Tools: Git, VS Code, Vite, Webpack
Other: Responsive Design, UI/UX, REST APIs`
        },
        contact: {
            description: 'Show contact information',
            fn: () => `Contact Information:
Email: your.email@example.com
LinkedIn: linkedin.com/in/yourprofile
GitHub: github.com/yourusername
Twitter: @yourhandle

Feel free to reach out!`
        },
        resume: {
            description: 'Show resume information',
            fn: () => `Resume:
Download my resume: [Link to resume PDF]

Experience:
- Frontend Developer at Company A (2022-Present)
- Web Developer Intern at Company B (2021-2022)

Education:
- Bachelor's in Computer Science, University Name (2018-2022)

Certifications:
- React Developer Certification
- JavaScript Algorithms and Data Structures`
        },
        experience: {
            description: 'Show work experience',
            fn: () => `Work Experience:
Frontend Developer | Company A | 2022-Present
- Developed responsive web applications using React
- Collaborated with design team for UI/UX improvements
- Optimized performance and accessibility

Web Developer Intern | Company B | 2021-2022
- Built interactive components with JavaScript
- Assisted in backend API integration
- Learned modern web development practices`
        },
        education: {
            description: 'Show education background',
            fn: () => `Education:
Bachelor of Science in Computer Science
University Name | 2018-2022
- GPA: 3.8/4.0
- Relevant Coursework: Data Structures, Algorithms, Web Development
- Projects: Portfolio website, E-commerce platform`
        },
        exit: {
            description: 'Exit the terminal',
            fn: () => 'Goodbye! Thanks for visiting my portfolio terminal.'
        }
    }

    const welcomeMessage = `Welcome to Portfolio CLI!

Explore my portfolio through these commands:
- about: About this portfolio
- projects: List my projects
- project <number>: Get details about a specific project
- skills: List my technical skills
- contact: Show contact information
- resume: Show resume information
- experience: Show work experience
- education: Show education background
- exit: Exit the terminal

Built-in commands: help, clear
Type 'help' for all commands or start exploring!`

    return (
        <MacWindow width="600px" height="500px" x="200" y="150" windowName={windowName} windowsState={windowsState} setWindowsState={setWindowsState}>
            <div className="cliWindow">
                <Terminal
                    commands={commands}
                    welcomeMessage={welcomeMessage}
                    promptLabel={'me@React:~$'}
                    promptLabelStyle={{ color: 'lightgreen' }}
                />
            </div>
        </MacWindow>
    )
}

export default Cli
