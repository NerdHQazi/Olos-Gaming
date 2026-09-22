<a name="readme-top"></a>


[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]


<div align="center">
  <a href="https://github.com/PeanutButterRat/pygame-checkers">
    <img src="assets/images/red_king.png" alt="Logo" height="80">
  </a>
  <h3 align="center">Pygame Checkers</h3>
  <p align="center">
    The classic game of checkers implemented in Python.
    <br />
    <br />
    <a href="https://github.com/PeanutButterRat/pygame-checkers/issues">Report Bug</a>
    ·
    <a href="https://github.com/PeanutButterRat/pygame-checkers/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>


<!-- ABOUT THE PROJECT -->
## About The Project

![Main Menu](/assets/readme/main-menu.jpg)

Pygame Checkers is a fully functional GUI version of checkers that you can play with other people. It supports local play against another person or CPU but also includes LAN functionality to play with another person over the same network.


<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

To get Pygame Checkers up and running, follow these simple steps shown below.

### Prerequisites

Before we get started, you will need to download some dependencies.
1. [Python](https://www.python.org/): Version 3.10+. You can most likely use a different version of Python, but I can guarantee it runs with at least Python 3.10.
2. [Pygame](https://www.pygame.org/). To install pygame, simply run `pip install pygame` in a terminal.

### Installation

1. Clone the repo.
   ```sh
   git clone https://github.com/PeanutButterRat/pygame-checkers.git
   ```

2. Run `main.py`.
   ```sh
   cd pygame-checkers  # You should now be in the repo directory.
   python src/main.py
   ```

Alternatively, you can simply download the executable from the releases page found [here](https://github.com/PeanutButterRat/pygame-checkers/releases/tag/1.0.0-stable) if you are running Windows.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- USAGE EXAMPLES -->
## Usage

1. To play Pygame checkers, run `main.py` or the pre-bundled executable. After running the program, you should be greeted with the screen shown below.

<div align="center">
  <img src="/assets/readme/main-menu.jpg" alt="Main Menu" width="450"/>
  <em><p>The main menu.</p><em>
</div>

2. To play locally, click on `Local` which should greet you with some options for configuring the intial board state. `Human Player` will allow two players to play on the same computer while `CPU` will pit you against my the simple AI built for the game.

<div align="center">
  <img src="/assets/readme/options.png" alt="Options Menu" width="450"/>
  <em><p>The options menu.</p><em>
</div>

3. To play over the local network, click on `Host` to create a session or `Join` to join a session. `Join` will bring you to a screen where you can input the host's IPv4 address. The easiest way is find the address is to use `ipconfig` for Windows users.

<div align="center">
  <img src="/assets/readme/join.PNG" alt="Join Menu" width="450"/>
  <em><p>Here the user can input the host's IPv4 address.</p><em>
</div>

4. Once in a game, you can click on a pawn to move it during your turn. Upon reaching the opposite side of the board, your pawn will turn into a king allowing it to move in all diagonal directions. To make multiple jumps, perform each jump individually before ending your turn. At the end of your turn, you can click `End Turn` to give control over to the other player. Right-click will cancel your current move if you change your mind mid-jump. Finally, `Forfeit` will end the game and give victory to the opponent.

<div align="center">
  <img src="/assets/readme/ingame.jpg" alt="Join Menu" width="450"/>
  <em><p>A standard checkers game in-progress.</p><em>
</div>

<!-- CONTRIBUTING -->
## Contributing

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with and present your idea there. I don't forsee anyone feeling inspired enough to contribute, but any contributions are greatly appreciated if you do decide to do so!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTACT -->
## Contact

Eric Brown - [GitHub](https://github.com/PeanutButterRat) - ebrown5676@gmail.com

Project Link: [https://github.com/PeanutButterRat/pygame-checkers](https://github.com/PeanutButterRat/pygame-checkers)

<p align="right">(<a href="#readme-top">back to top</a>)</p>


[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/PeanutButterRat/pygame-checkers/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/eric-brown-b0a258202/
