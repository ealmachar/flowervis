/*

	quick .csv to .json parsing/formatting program

*/

#include <iostream>
#include <fstream>
#include <string>
#include <sstream>
#include <time.h>
#include <vector>

using namespace std;

int numRels = 0;

vector<string> get_line(string, int&, bool&);

int main(){
	string line;
	int index = 0;


	vector<string> header;
	vector<vector<string>> foods;
	
	int headerStart;
	
	int dummy = 0;
	int numItems = 0;
	bool pass;
	ifstream myfile ("en.openfoodfacts.org.products.tsv");

	
	vector<string> data;
	
	if(myfile.is_open()){
		getline(myfile, line);
		
		
		
		header = get_line(line, dummy, pass);
		
		int i;
		vector<string>::iterator it;
		for (it = header.begin(), i = 0 ; it != header.end(); ++it, i++){
//    		cout << *it << endl;
    		if((*it).compare("energy_100g") == 0){
    			headerStart = i;
    		}
    	}
    	
//    	cout << headerStart;


		
		
		
		while( getline(myfile, line)){

			if(line.length() > 0){
				
				pass = true;
				
				data = get_line(line, index, pass);

				
				if(pass){
					foods.push_back(data);
					numItems++;
				}



				index ++;
			}	
		}
		
		cout << numItems << endl;
		
	}
	else{
		cout << "Fail infile" << endl;
	}
	
	myfile.close();
	
	
	
	
	
	
	
	
	

	
	
	
	
	
	
	
	
	ofstream outfile("foods.json");
	
	bool start = true;
	bool start2 = true;
	
	if(outfile.is_open()){

		outfile << "[";
		for(int i = 0; i < foods.size(); i ++){

			if(!start){
				outfile << "," << endl;	
			}
			else{
				start = false;
			}
			
			outfile << endl << "{";

			start2 = true;

			for(int j = 0; j < foods[i].size(); j++){
			
				
				
				if(foods[i][j].size() > 0 && j >= 63){
					if(!start2){
						outfile << "," << endl;	
					}
					else{
						start2 = false;
					}
					outfile << "\"" << header[j] << "\":" << foods[i][j];
				}
				else if(foods[i][j].size() > 0 && (j == 7 || j == 33 || j == 60 || j == 61)){
					if(!start2){
						outfile << "," << endl;	
					}
					else{
						start2 = false;
					}
					outfile << "\"" << header[j] << "\":\"" << foods[i][j] << "\"";
				}
			}

			outfile << "}";

		}
		outfile << "]";
	}
	else{
		cout << "Fail outfile" << endl;
	}
	
	outfile.close();
	
	return 0;
}

vector<string> get_line(string line, int& i, bool& pass){
	vector<string> result;
	
	stringstream ss(line);
	
	string substr;
	
	int index = 0;
	int relevance = 0;
	
	
	while(getline( ss, substr, '\t') && pass){
		result.push_back(substr);
		
		if(index >= 63 && substr.length() && i != 0 > 0){
			relevance ++;
		}
		
		if(index == 7 && substr.length() < 1){
			pass = false;
		}
		
		index++;
	};

	if(relevance > 20){	
		numRels++;
	}
	else{
		pass = false;
	}

	return result;
}



