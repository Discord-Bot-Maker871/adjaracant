import React from 'react';
import { withRouter } from 'react-router';
import adjaranetService from 'services/adjaranetService';
import VideoPlayer from 'components/videoPlayer';
import NavBar from 'components/navBar';
import SourceControl from 'components/watch/sourceControl';
import slugify from 'services/utilities/slugify';

class WatchPage extends React.Component {
    constructor(props) {
        super(props)
        this.player = React.createRef();
        this.state = {
            id: null,
            isTvShow: null,
            title: null,
            seasons: null,
            episodes: null,
            activeSeason: 1,
            activeEpisode: 0,
            backgroundImage: null,
            videoJsOptions: null,
            episodesLoading: false
        }
    }

    componentDidMount() {

        // getting data for first season/first episode for initial load
        adjaranetService.getData(this.props.match.params.id)
        .then(response => {
            const id = response.data.data.id;
            const matchingTitle = this.matchTitle(response.data.data, this.props.match.params.title);
            const seasonsLength = response.data.data.seasons ? response.data.data.seasons.data.length : null;
            const isTvShow = response.data.data.isTvShow;
            const backgroundImage = response.data.data.covers.data['1920'];

            adjaranetService.getFiles(id)
            .then(response => {
                
                const firstEpisodeSources = this.getEpisodeSources(response.data.data)

                this.setState({
                    id: id,
                    isTvShow: isTvShow,
                    title: matchingTitle,
                    seasons: seasonsLength,
                    episodes: response.data.data,
                    backgroundImage: backgroundImage,
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

            })
        })

    }

    render() {
        return (
            <React.Fragment>
                <NavBar />

                {this.state.videoJsOptions && (
                    <VideoPlayer ref={this.player} {...this.state.videoJsOptions} backgroundImage={this.state.backgroundImage} title={this.state.title} />
                )}


                {this.state.isTvShow && this.state.episodes && (
                    <SourceControl
                        seasons={this.state.seasons}
                        activeSeason={this.state.activeSeason}
                        activeEpisode={this.state.activeEpisode}
                        episodes={this.state.episodes}
                        changeSeason={this.changeSeason}
                        changeSource={this.changeSource}
                        loading={this.state.episodesLoading}
                    />
                )}
            </React.Fragment>
        )
    }

    changeSource = (episodeIndex) => {
        // episodes are zero-based unlike from seasons
        const sources = this.getEpisodeSources(this.state.episodes, episodeIndex-1)
        this.player.current.changeSource(sources)
        this.setState({
            activeEpisode: episodeIndex-1
        })
    }

    matchTitle(data, slug) {
        const { originalName, primaryName, secondaryName, tertiaryName } = data;
        const matchingTitles = [originalName, primaryName, secondaryName, tertiaryName].filter(title => slugify(title) === slug);
        return matchingTitles[0] || 'title not matched';
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

    changeSeason = (seasonIndex) => {
        if (seasonIndex !== this.state.activeSeason) {
            this.setState({
                episodesLoading: true
            })
    
            const activeSeason = seasonIndex
            const episodes = []
    
            adjaranetService.getFiles(this.state.id, seasonIndex)
            .then(response => {
                response.data.data.forEach(episode => {
                    episodes.push(episode)
                })
    
                this.setState({
                    episodes,
                    activeSeason,
                    episodesLoading: false
                })
    
                this.changeSource(1)
            })
        }
    }
}

/* ---------- */

export default withRouter(WatchPage);