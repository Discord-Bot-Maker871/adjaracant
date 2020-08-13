import React from 'react';
import { withRouter } from 'react-router';
import adjaranetService from 'services/adjaranetService';
import VideoPlayer from 'components/videoPlayer';
import NavBar from 'components/navBar';
import Checkbox from 'components/checkbox';
import SourceControl from 'components/watch/sourceControl';

/* ---------- */
import './styles/watch.scss';
/* ---------- */

class WatchPage extends React.Component {
    constructor(props) {
        super(props)
        this.player = React.createRef();
        this.state = {
            id: null,
            isTvShow: null,
            seasons: null,
            episodes: null,
            activeSeason: 1,
            activeEpisode: 0,
            backgroundImage: null,
            videoJsOptions: null,
            episodesLoading: false,
            autoSwitchEpisodes: false
        }
    }

    async componentDidMount() {
        // There are no lifecycle methods after componentDidMount so it is safe to use  async/await here

        const initialState = await this.getInitialData(this.props.match.params.id)
        const episodes = await this.getEpisodes(initialState.id, 1)
        const firstEpisodeSources = this.getEpisodeSources(episodes)

        this.setState({

            ...initialState,
            episodes: episodes,
            videoJsOptions: {
                autoplay: false,
                controls: true,
                controlBar: {
                    children: [
                        "playToggle",
                        "volumePanel",
                        "progressControl",
                        "remainingTimeDisplay",
                        "qualitySelector",
                        "fullscreenToggle"
                    ]
                },
                sources: firstEpisodeSources
            }

        })
    }

    render() {
        return (
            <React.Fragment>
                <NavBar />

                {this.state.videoJsOptions && (
                    <VideoPlayer 
                        ref={this.player} 
                        {...this.state.videoJsOptions} 
                        backgroundImage={this.state.backgroundImage}
                        autoplayEpisodes={this.state.autoSwitchEpisodes}
                        activeEpisode={this.state.activeEpisode}
                        episodes={this.state.episodes}
                        changeSource={this.changeSource}
                    />
                )}


                {this.state.isTvShow && this.state.episodes && (
                    <React.Fragment>
                        <div className="player-options">
                            <Checkbox checked={this.state.autoSwitchEpisodes} onClick={() => this.setState({autoSwitchEpisodes: !this.state.autoSwitchEpisodes})} />
                            <p className={this.state.autoSwitchEpisodes ? 'active' : ''}>Autoswitch Eps.</p>
                        </div>

                        <SourceControl
                            seasons={this.state.seasons}
                            activeSeason={this.state.activeSeason}
                            activeEpisode={this.state.activeEpisode}
                            episodes={this.state.episodes}
                            changeSeason={this.changeSeason}
                            changeSource={this.changeSource}
                            loading={this.state.episodesLoading}
                        />
                    </React.Fragment>
                )}
            </React.Fragment>
        )
    }

    getInitialData(adjaraId) {
        return adjaranetService.getData(adjaraId)
            .then(response => {

                const id = response.data.data.id;
                const seasons = response.data.data.seasons ? response.data.data.seasons.data.length : null;
                const isTvShow = response.data.data.isTvShow;
                const backgroundImage = response.data.data.covers.data['1920'];

                return {
                    id,
                    seasons,
                    isTvShow,
                    backgroundImage
                }
            })
    }

    getEpisodes(movieId, seasonIndex) {
        return adjaranetService.getFiles(movieId, seasonIndex)
            .then(response => {
                const episodes = response.data.data
                return episodes 
            })
    }

    changeSource = (episodeIndex) => {
        // episodes are zero-based unlike from seasons
        const sources = this.getEpisodeSources(this.state.episodes, episodeIndex-1)
        this.player.current.changeSource(sources)
        this.setState({
            activeEpisode: episodeIndex-1
        })
    }

    getEpisodeSources(episodes, index=0) {

        /*  index is the index of an episode, by default, if source is movie, there will be only one index, which is 0
            if it is a TV show with multiple episodes, we will change the index attribute accordingly, but regardless of the
            content type, we want to grab `0` index on page load first.

            both seasons - with value '0' and with value '1' return first season.
            
        */

        const sources = []

        if (typeof episodes[index] !== "undefined") {
            episodes[index].files.forEach(element => {
            
                element.files.forEach(file => {
                    sources.push({
                        src: file.src, 
                        quality: file.quality, 
                        label: `${element.lang} - ${file.quality}`,
                        type: "video/mp4"
                    })
                })
    
            })
    
            return sources;   
        }
        // if there are no movie sources return nothing
        return;
    }

    changeSeason = async (seasonIndex) => {
        if (seasonIndex !== this.state.activeSeason) {
            this.setState({
                episodesLoading: true
            })
    
            const activeSeason = seasonIndex
            const episodes = await this.getEpisodes(this.state.id, seasonIndex)
	    
            this.setState({
                episodes,
                activeSeason,
                episodesLoading: false
            })
	
            this.changeSource(1)
        }
    }
}

/* ---------- */

export default withRouter(WatchPage);
