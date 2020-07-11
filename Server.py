from Math import Math
from flask import Flask, jsonify, request
import os

class Server:
    def __init__(self):  
        self.app = Flask(__name__, static_url_path='')
        self.port = int(os.environ.get("PORT", 5000))
        self.math = Math()
        self.set_routes()
        self.run_server()   
           
    def set_routes(self):
        @self.app.route('/')
        def index():
            return self.app.send_static_file('index.html')

        @self.app.route('/matrix-inverse/gauss/<order>')
        def matrix_inverse_gauss(order):
            matrix = self.math.create_matrix(int(order))
            inverse_tuple = self.math.inverse_gauss(matrix)
            return jsonify(
                inverse=inverse_tuple[0] if int(order) <= 10 else [],
                time=inverse_tuple[1]
            )

        @self.app.route('/matrix-inverse/numpy/<order>')
        def matrix_inverse_numpy(order):
            matrix = self.math.create_matrix(int(order))
            inverse_tuple = self.math.inverse_numpy(matrix)
            return jsonify(
                inverse=inverse_tuple[0] if int(order) <= 10 else [],
                time=inverse_tuple[1]
            )

        @self.app.route('/diffraction-intensities')
        def calculate_intensities():
            d_a = request.args.get('dA')
            d_b = request.args.get('dB')
            n_a = request.args.get('NA')
            n_b = request.args.get('NB')
            n = request.args.get('N')
            intensities_tuple = self.math.calculate_intensities(d_a, d_b, n_a, n_b, n)
            return jsonify(
                intensities=intensities_tuple[0],
                time=intensities_tuple[1]
            )
    
    def run_server(self):
        self.app.run(host='0.0.0.0', port=self.port)
        